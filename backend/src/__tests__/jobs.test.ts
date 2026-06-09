import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

interface RedisMock {
  set: ReturnType<typeof vi.fn>;
}

const mocks = vi.hoisted(() => ({
  redis: null as RedisMock | null,
  loggerError: vi.fn(),
  loggerInfo: vi.fn(),
  loggerWarn: vi.fn(),
  loggerDebug: vi.fn(),
}));

vi.mock('../lib/redis', () => ({
  get redis() {
    return mocks.redis;
  },
}));

vi.mock('../lib/logger', () => ({
  logger: {
    error: mocks.loggerError,
    info: mocks.loggerInfo,
    warn: mocks.loggerWarn,
    debug: mocks.loggerDebug,
  },
}));

// Prevent the real job (and its prisma/services import chain) from loading.
vi.mock('../jobs/virahaMomentsRecompute', () => ({
  runVirahaMomentsRecompute: vi.fn().mockResolvedValue(undefined),
}));

import { startJobs, stopJobs, jobsEnabled, type BackgroundJob } from '../jobs/scheduler';

function makeJob(overrides: Partial<BackgroundJob> = {}): BackgroundJob {
  return {
    name: 'testJob',
    intervalMs: 60_000,
    initialDelayMs: 1_000,
    run: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

const ORIGINAL_ENABLE_JOBS = process.env.ENABLE_JOBS;

describe('jobs scheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.redis = null;
    mocks.loggerError.mockClear();
    mocks.loggerInfo.mockClear();
    mocks.loggerWarn.mockClear();
    mocks.loggerDebug.mockClear();
    process.env.ENABLE_JOBS = 'true';
  });

  afterEach(() => {
    stopJobs();
    vi.useRealTimers();
    if (ORIGINAL_ENABLE_JOBS === undefined) {
      delete process.env.ENABLE_JOBS;
    } else {
      process.env.ENABLE_JOBS = ORIGINAL_ENABLE_JOBS;
    }
  });

  describe('jobsEnabled', () => {
    it('honors explicit ENABLE_JOBS=false', () => {
      process.env.ENABLE_JOBS = 'false';
      expect(jobsEnabled()).toBe(false);
    });

    it('honors explicit ENABLE_JOBS=true', () => {
      process.env.ENABLE_JOBS = 'true';
      expect(jobsEnabled()).toBe(true);
    });

    it('defaults to disabled outside production (NODE_ENV=test)', () => {
      delete process.env.ENABLE_JOBS;
      expect(jobsEnabled()).toBe(false);
    });

    it('treats unrecognized values as unset (falls back to NODE_ENV default)', () => {
      process.env.ENABLE_JOBS = 'maybe';
      expect(jobsEnabled()).toBe(false);
    });
  });

  describe('startJobs / stopJobs', () => {
    it('does not schedule any timers when ENABLE_JOBS=false', () => {
      process.env.ENABLE_JOBS = 'false';
      const job = makeJob();
      startJobs([job]);
      expect(vi.getTimerCount()).toBe(0);
      vi.advanceTimersByTime(10 * 60_000);
      expect(job.run).not.toHaveBeenCalled();
    });

    it('runs a job after its initial delay, then on its interval', async () => {
      const job = makeJob({ initialDelayMs: 1_000, intervalMs: 60_000 });
      startJobs([job]);

      expect(job.run).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(1_000);
      expect(job.run).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(60_000);
      expect(job.run).toHaveBeenCalledTimes(2);

      await vi.advanceTimersByTimeAsync(120_000);
      expect(job.run).toHaveBeenCalledTimes(4);
    });

    it('staggers first runs using each job initial delay', async () => {
      const early = makeJob({ name: 'early', initialDelayMs: 1_000 });
      const late = makeJob({ name: 'late', initialDelayMs: 5_000 });
      startJobs([early, late]);

      await vi.advanceTimersByTimeAsync(1_000);
      expect(early.run).toHaveBeenCalledTimes(1);
      expect(late.run).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(4_000);
      expect(late.run).toHaveBeenCalledTimes(1);
    });

    it('stops cleanly — no further runs after stopJobs', async () => {
      const job = makeJob({ initialDelayMs: 1_000, intervalMs: 60_000 });
      startJobs([job]);

      await vi.advanceTimersByTimeAsync(1_000);
      expect(job.run).toHaveBeenCalledTimes(1);

      stopJobs();
      expect(vi.getTimerCount()).toBe(0);

      await vi.advanceTimersByTimeAsync(10 * 60_000);
      expect(job.run).toHaveBeenCalledTimes(1);
    });

    it('is idempotent — calling startJobs twice does not double-schedule', async () => {
      const job = makeJob({ initialDelayMs: 1_000 });
      startJobs([job]);
      startJobs([job]);

      await vi.advanceTimersByTimeAsync(1_000);
      expect(job.run).toHaveBeenCalledTimes(1);
    });

    it('can be restarted after stopJobs', async () => {
      const job = makeJob({ initialDelayMs: 1_000 });
      startJobs([job]);
      stopJobs();

      startJobs([job]);
      await vi.advanceTimersByTimeAsync(1_000);
      expect(job.run).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    it('swallows and logs job errors without crashing, and keeps the schedule alive', async () => {
      const run = vi.fn().mockRejectedValue(new Error('boom'));
      const job = makeJob({ run, initialDelayMs: 1_000, intervalMs: 60_000 });
      startJobs([job]);

      await vi.advanceTimersByTimeAsync(1_000);
      expect(run).toHaveBeenCalledTimes(1);
      expect(mocks.loggerError).toHaveBeenCalledWith(
        expect.objectContaining({ job: 'testJob', err: expect.any(Error) }),
        'Job failed'
      );

      // Next tick still fires after a failure.
      await vi.advanceTimersByTimeAsync(60_000);
      expect(run).toHaveBeenCalledTimes(2);
    });

    it('swallows synchronous throws from run()', async () => {
      const run = vi.fn().mockImplementation(() => {
        throw new Error('sync boom');
      });
      const job = makeJob({ run: run as unknown as () => Promise<void>, initialDelayMs: 1_000 });
      startJobs([job]);

      await vi.advanceTimersByTimeAsync(1_000);
      expect(run).toHaveBeenCalledTimes(1);
      expect(mocks.loggerError).toHaveBeenCalled();
    });
  });

  describe('redis lock', () => {
    it('runs without a lock when redis is absent', async () => {
      mocks.redis = null;
      const job = makeJob({ initialDelayMs: 1_000 });
      startJobs([job]);

      await vi.advanceTimersByTimeAsync(1_000);
      expect(job.run).toHaveBeenCalledTimes(1);
    });

    it('acquires the lock via SET NX EX and runs when acquired', async () => {
      const set = vi.fn().mockResolvedValue('OK');
      mocks.redis = { set };
      const job = makeJob({ initialDelayMs: 1_000, intervalMs: 60_000 });
      startJobs([job]);

      await vi.advanceTimersByTimeAsync(1_000);
      expect(set).toHaveBeenCalledWith(
        'jobs:lock:testJob',
        expect.any(String),
        'EX',
        expect.any(Number),
        'NX'
      );
      expect(job.run).toHaveBeenCalledTimes(1);
    });

    it('skips the run when another instance holds the lock', async () => {
      const set = vi.fn().mockResolvedValue(null);
      mocks.redis = { set };
      const job = makeJob({ initialDelayMs: 1_000 });
      startJobs([job]);

      await vi.advanceTimersByTimeAsync(1_000);
      expect(set).toHaveBeenCalled();
      expect(job.run).not.toHaveBeenCalled();
    });

    it('degrades to running when redis errors on lock acquisition', async () => {
      const set = vi.fn().mockRejectedValue(new Error('redis down'));
      mocks.redis = { set };
      const job = makeJob({ initialDelayMs: 1_000 });
      startJobs([job]);

      await vi.advanceTimersByTimeAsync(1_000);
      expect(job.run).toHaveBeenCalledTimes(1);
      expect(mocks.loggerWarn).toHaveBeenCalledWith(
        expect.objectContaining({ job: 'testJob' }),
        'Job lock unavailable — running without lock'
      );
    });
  });
});

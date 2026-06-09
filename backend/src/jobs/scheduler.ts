import { env } from '../config/env';
import { logger } from '../lib/logger';
import { redis } from '../lib/redis';
import { runVirahaMomentsRecompute } from './virahaMomentsRecompute';

export interface BackgroundJob {
  readonly name: string;
  readonly intervalMs: number;
  /** Stagger first runs so boot is not slowed and jobs don't fire together. */
  readonly initialDelayMs: number;
  readonly run: () => Promise<void>;
}

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const MIN_LOCK_TTL_SECONDS = 60;

const DEFAULT_JOBS: readonly BackgroundJob[] = [
  {
    name: 'virahaMomentsRecompute',
    intervalMs: HOUR_MS,
    initialDelayMs: 30 * 1000,
    run: runVirahaMomentsRecompute,
  },
  // trendingWarm (every 15 min) intentionally omitted: the trending logic
  // (getTrendingLocations / getTrendingTags) lives only inside
  // exploreController.ts as req/res-bound handlers and is not exported from
  // any service or lib. Pre-warming would require refactoring a file owned by
  // another agent. Revisit once trending is extracted into a service.
];

let timers: readonly NodeJS.Timeout[] = [];
let started = false;
// In-process overlap guard: job names whose previous run has not finished.
let runningJobs: ReadonlySet<string> = new Set();

/**
 * Whether background jobs should run.
 *
 * ENABLE_JOBS comes from the validated config (src/config/env.ts). Accepted
 * values: true/false, 1/0, yes/no, on/off, enabled/disabled
 * (case-insensitive); unrecognized values are warned about once at startup.
 * Default when unset or unrecognized: enabled only when NODE_ENV=production
 * (so tests and local dev never spin timers unless opted in).
 */
export function jobsEnabled(): boolean {
  if (env.ENABLE_JOBS !== undefined) return env.ENABLE_JOBS;
  return env.NODE_ENV === 'production';
}

/**
 * Best-effort cross-instance lock via Redis SET NX EX. The lock is never
 * explicitly released — its TTL (just under the job interval) expires before
 * the next tick, which keeps the code path trivial and prevents two instances
 * from double-running the same tick. Degrades to "always acquired" when Redis
 * is absent or erroring, so a Redis outage never stops jobs on a single node.
 */
async function acquireLock(jobName: string, intervalMs: number): Promise<boolean> {
  if (!redis) return true;
  const ttlSeconds = Math.max(MIN_LOCK_TTL_SECONDS, Math.floor((intervalMs / 1000) * 0.9));
  try {
    const result = await redis.set(
      `jobs:lock:${jobName}`,
      `${process.pid}:${Date.now()}`,
      'EX',
      ttlSeconds,
      'NX'
    );
    return result === 'OK';
  } catch (err) {
    logger.warn({ err, job: jobName }, 'Job lock unavailable — running without lock');
    return true;
  }
}

async function executeJob(job: BackgroundJob): Promise<void> {
  // In-process overlap guard: if a run outlives its interval (and the Redis
  // lock TTL), the next tick must not start a second concurrent run.
  if (runningJobs.has(job.name)) {
    logger.debug({ job: job.name }, 'Job skipped — previous run still in progress');
    return;
  }
  runningJobs = new Set([...runningJobs, job.name]);

  const startedAt = Date.now();
  try {
    const acquired = await acquireLock(job.name, job.intervalMs);
    if (!acquired) {
      logger.debug({ job: job.name }, 'Job skipped — lock held by another instance');
      return;
    }
    await job.run();
    logger.info({ job: job.name, durationMs: Date.now() - startedAt }, 'Job completed');
  } catch (err) {
    // Never let a job crash the process.
    logger.error({ err, job: job.name, durationMs: Date.now() - startedAt }, 'Job failed');
  } finally {
    runningJobs = new Set([...runningJobs].filter((name) => name !== job.name));
  }
}

/**
 * Start the in-process background job scheduler. No-op when jobs are disabled
 * (see jobsEnabled) or already started. Timers are unref'd so they never keep
 * the process alive on their own.
 *
 * @param jobs override used by tests; production callers pass nothing.
 */
export function startJobs(jobs: readonly BackgroundJob[] = DEFAULT_JOBS): void {
  if (started) return;
  if (!jobsEnabled()) {
    logger.info('Background jobs disabled (ENABLE_JOBS)');
    return;
  }
  started = true;

  for (const job of jobs) {
    const initialTimer = setTimeout(() => {
      void executeJob(job);
      const intervalTimer = setInterval(() => {
        void executeJob(job);
      }, job.intervalMs);
      intervalTimer.unref();
      timers = [...timers, intervalTimer];
    }, job.initialDelayMs);
    initialTimer.unref();
    timers = [...timers, initialTimer];
  }

  logger.info(
    { jobs: jobs.map((j) => ({ name: j.name, intervalMs: j.intervalMs })) },
    'Background jobs started'
  );
}

/** Stop all scheduled jobs. Safe to call multiple times. */
export function stopJobs(): void {
  for (const timer of timers) {
    clearTimeout(timer);
  }
  timers = [];
  started = false;
  // Reset the overlap guard: a stop/start cycle (shutdown, test teardown)
  // must not leave stale "running" flags that would skip future ticks.
  runningJobs = new Set();
}

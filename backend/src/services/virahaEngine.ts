import { prisma } from '../lib/prisma';

interface OnThisDayItem {
  id: string;
  type: 'post' | 'journal_entry';
  title: string;
  thumbnail: string | null;
  locationName: string | null;
  locationCity: string | null;
  locationCountry: string | null;
  yearsAgo: number;
  originalDate: string;
  journalId?: string;
}

interface VirahaMomentItem {
  id: string;
  type: string;
  title: string;
  description: string | null;
  referenceType: string;
  referenceId: string;
  thumbnail: string | null;
  locationName: string | null;
  yearsAgo: number | null;
  momentDate: string;
}

/**
 * Get content from the same calendar day in previous years.
 */
export async function getOnThisDay(userId: string): Promise<OnThisDayItem[]> {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const currentYear = now.getFullYear();

  // Find posts from this day in previous years
  const posts = await prisma.$queryRaw<Array<{
    id: string;
    caption: string | null;
    media_urls: string[];
    media_thumbnails: string[];
    location_name: string | null;
    location_city: string | null;
    location_country: string | null;
    posted_at: Date;
  }>>`
    SELECT id, caption, media_urls, media_thumbnails, location_name, location_city, location_country, posted_at
    FROM posts
    WHERE user_id = ${userId}::uuid
      AND is_deleted = false
      AND EXTRACT(MONTH FROM posted_at) = ${month}
      AND EXTRACT(DAY FROM posted_at) = ${day}
      AND EXTRACT(YEAR FROM posted_at) < ${currentYear}
    ORDER BY posted_at DESC
    LIMIT 20
  `;

  // Find journal entries from this day in previous years
  const entries = await prisma.$queryRaw<Array<{
    id: string;
    title: string | null;
    media_urls: string[];
    location_name: string | null;
    location_city: string | null;
    location_country: string | null;
    date: Date | null;
    created_at: Date;
    journal_id: string;
  }>>`
    SELECT je.id, je.title, je.media_urls, je.location_name, je.location_city, je.location_country, je.date, je.created_at, je.journal_id
    FROM journal_entries je
    JOIN journals j ON j.id = je.journal_id
    WHERE j.user_id = ${userId}::uuid
      AND je.is_deleted = false
      AND j.is_deleted = false
      AND (
        (je.date IS NOT NULL AND EXTRACT(MONTH FROM je.date) = ${month} AND EXTRACT(DAY FROM je.date) = ${day} AND EXTRACT(YEAR FROM je.date) < ${currentYear})
        OR
        (je.date IS NULL AND EXTRACT(MONTH FROM je.created_at) = ${month} AND EXTRACT(DAY FROM je.created_at) = ${day} AND EXTRACT(YEAR FROM je.created_at) < ${currentYear})
      )
    ORDER BY COALESCE(je.date, je.created_at) DESC
    LIMIT 20
  `;

  const items: OnThisDayItem[] = [];

  for (const p of posts) {
    const postYear = new Date(p.posted_at).getFullYear();
    items.push({
      id: p.id,
      type: 'post',
      title: p.caption?.slice(0, 100) || p.location_name || 'A memory',
      thumbnail: p.media_thumbnails[0] || p.media_urls[0] || null,
      locationName: p.location_name,
      locationCity: p.location_city,
      locationCountry: p.location_country,
      yearsAgo: currentYear - postYear,
      originalDate: new Date(p.posted_at).toISOString(),
    });
  }

  for (const e of entries) {
    const entryDate = e.date || e.created_at;
    const entryYear = new Date(entryDate).getFullYear();
    items.push({
      id: e.id,
      type: 'journal_entry',
      title: e.title || e.location_name || 'A journal entry',
      thumbnail: e.media_urls[0] || null,
      locationName: e.location_name,
      locationCity: e.location_city,
      locationCountry: e.location_country,
      yearsAgo: currentYear - entryYear,
      originalDate: new Date(entryDate).toISOString(),
      journalId: e.journal_id,
    });
  }

  // Sort by years ago (most recent memories first)
  items.sort((a, b) => a.yearsAgo - b.yearsAgo);

  return items;
}

/**
 * Get computed Viraha Moments for a user (pre-computed + live).
 * Falls back to live computation if no pre-computed moments exist.
 */
export async function getMoments(userId: string): Promise<VirahaMomentItem[]> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000);

  // Check for pre-computed moments first
  const precomputed = await prisma.virahaMoment.findMany({
    where: {
      userId,
      dismissed: false,
      deliveredAt: { gte: todayStart, lt: todayEnd },
    },
    orderBy: { deliveredAt: 'desc' },
    take: 10,
  });

  if (precomputed.length > 0) {
    return precomputed.map((m) => ({
      id: m.id,
      type: m.type,
      title: m.title,
      description: m.description,
      referenceType: m.referenceType,
      referenceId: m.referenceId,
      thumbnail: m.thumbnail,
      locationName: m.locationName,
      yearsAgo: m.yearsAgo,
      momentDate: m.momentDate.toISOString(),
    }));
  }

  // Live computation: generate on-this-day moments
  const onThisDay = await getOnThisDay(userId);
  return onThisDay.map((item) => ({
    id: item.id,
    type: 'on_this_day',
    title: item.title,
    description: `${item.yearsAgo} ${item.yearsAgo === 1 ? 'year' : 'years'} ago`,
    referenceType: item.type,
    referenceId: item.id,
    thumbnail: item.thumbnail,
    locationName: item.locationName,
    yearsAgo: item.yearsAgo,
    momentDate: item.originalDate,
  }));
}

/**
 * Compute and store Viraha Moments for a user.
 * Called by scheduled job or on-demand.
 */
export async function computeMomentsForUser(userId: string): Promise<number> {
  const onThisDay = await getOnThisDay(userId);
  const now = new Date();

  // Also compute place anniversaries
  const placeAnniversaries = await getPlaceAnniversaries(userId);

  const allMoments = [
    ...onThisDay.map((item) => ({
      userId,
      type: 'on_this_day' as const,
      title: `${item.yearsAgo} ${item.yearsAgo === 1 ? 'year' : 'years'} ago in ${item.locationName || 'a special place'}`,
      description: item.title,
      referenceType: item.type,
      referenceId: item.id,
      thumbnail: item.thumbnail,
      locationName: item.locationName,
      yearsAgo: item.yearsAgo,
      momentDate: new Date(item.originalDate),
      deliveredAt: now,
    })),
    ...placeAnniversaries,
  ];

  if (allMoments.length === 0) return 0;

  const result = await prisma.virahaMoment.createMany({
    data: allMoments,
    skipDuplicates: true,
  });

  return result.count;
}

/**
 * Find places where the user first visited on this calendar date.
 */
async function getPlaceAnniversaries(userId: string): Promise<Array<{
  userId: string;
  type: string;
  title: string;
  description: string;
  referenceType: string;
  referenceId: string;
  thumbnail: string | null;
  locationName: string | null;
  yearsAgo: number;
  momentDate: Date;
  deliveredAt: Date;
}>> {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const currentYear = now.getFullYear();

  // Find the user's first post at each unique location, then filter for today's anniversary
  const anniversaries = await prisma.$queryRaw<Array<{
    id: string;
    location_name: string | null;
    location_city: string | null;
    location_country: string | null;
    media_thumbnails: string[];
    first_visit: Date;
  }>>`
    WITH first_visits AS (
      SELECT DISTINCT ON (location_city, location_country)
        id, location_name, location_city, location_country, media_thumbnails, posted_at AS first_visit
      FROM posts
      WHERE user_id = ${userId}::uuid AND is_deleted = false AND location_city IS NOT NULL
      ORDER BY location_city, location_country, posted_at ASC
    )
    SELECT * FROM first_visits
    WHERE EXTRACT(MONTH FROM first_visit) = ${month}
      AND EXTRACT(DAY FROM first_visit) = ${day}
      AND EXTRACT(YEAR FROM first_visit) < ${currentYear}
  `;

  return anniversaries.map((a) => {
    const yearsAgo = currentYear - new Date(a.first_visit).getFullYear();
    const placeName = a.location_city
      ? `${a.location_city}${a.location_country ? ', ' + a.location_country : ''}`
      : a.location_name || 'a special place';
    return {
      userId,
      type: 'place_anniversary',
      title: `It's been ${yearsAgo} ${yearsAgo === 1 ? 'year' : 'years'} since ${placeName}`,
      description: `You first visited ${placeName} on this day`,
      referenceType: 'post',
      referenceId: a.id,
      thumbnail: a.media_thumbnails[0] || null,
      locationName: a.location_name,
      yearsAgo,
      momentDate: new Date(a.first_visit),
      deliveredAt: now,
    };
  });
}

/**
 * Get place history — all user's content at a location.
 */
export async function getPlaceHistory(userId: string, lat: number, lng: number, radius: number = 0.01) {
  const posts = await prisma.post.findMany({
    where: {
      userId,
      isDeleted: false,
      locationLat: { gte: lat - radius, lte: lat + radius },
      locationLng: { gte: lng - radius, lte: lng + radius },
    },
    orderBy: { postedAt: 'desc' },
    select: {
      id: true,
      caption: true,
      mediaUrls: true,
      mediaThumbnails: true,
      locationName: true,
      locationCity: true,
      locationCountry: true,
      postedAt: true,
      tags: true,
    },
  });

  const entries = await prisma.journalEntry.findMany({
    where: {
      isDeleted: false,
      locationLat: { gte: lat - radius, lte: lat + radius },
      locationLng: { gte: lng - radius, lte: lng + radius },
      journal: { userId, isDeleted: false },
    },
    orderBy: { date: 'desc' },
    select: {
      id: true,
      title: true,
      content: true,
      mediaUrls: true,
      locationName: true,
      locationCity: true,
      locationCountry: true,
      date: true,
      mood: true,
      journalId: true,
    },
  });

  const placeNote = await prisma.placeNote.findFirst({
    where: {
      userId,
      locationLat: { gte: lat - radius, lte: lat + radius },
      locationLng: { gte: lng - radius, lte: lng + radius },
    },
  });

  const firstVisit = posts.length > 0
    ? posts[posts.length - 1].postedAt
    : entries.length > 0
      ? entries[entries.length - 1].date
      : null;

  return {
    posts: posts.map((p) => ({
      ...p,
      locationLat: undefined,
      locationLng: undefined,
      postedAt: p.postedAt.toISOString(),
    })),
    journalEntries: entries.map((e) => ({
      ...e,
      locationLat: undefined,
      locationLng: undefined,
      date: e.date?.toISOString() || null,
      contentPreview: e.content?.replace(/<[^>]*>/g, '').slice(0, 200) || null,
      content: undefined,
    })),
    placeNote: placeNote ? {
      id: placeNote.id,
      note: placeNote.note,
      updatedAt: placeNote.updatedAt.toISOString(),
    } : null,
    stats: {
      totalPosts: posts.length,
      totalEntries: entries.length,
      firstVisit: firstVisit?.toISOString() || null,
      totalVisits: posts.length + entries.length,
    },
  };
}

/**
 * Get places ranked by emotional resonance.
 * Score = recency * density * content richness
 */
export async function getPlaceResonance(userId: string) {
  const places = await prisma.$queryRaw<Array<{
    location_city: string;
    location_country: string;
    location_name: string | null;
    location_lat: number;
    location_lng: number;
    post_count: bigint;
    latest_visit: Date;
    first_visit: Date;
    has_journal: boolean;
    thumbnail: string | null;
  }>>`
    WITH place_stats AS (
      SELECT
        location_city,
        location_country,
        MIN(location_name) AS location_name,
        AVG(location_lat::float)::decimal AS location_lat,
        AVG(location_lng::float)::decimal AS location_lng,
        COUNT(*) AS post_count,
        MAX(posted_at) AS latest_visit,
        MIN(posted_at) AS first_visit,
        (SELECT media_thumbnails[1] FROM posts p2
         WHERE p2.location_city = posts.location_city
           AND p2.location_country = posts.location_country
           AND p2.user_id = ${userId}::uuid
           AND p2.is_deleted = false
         ORDER BY p2.posted_at DESC LIMIT 1) AS thumbnail
      FROM posts
      WHERE user_id = ${userId}::uuid
        AND is_deleted = false
        AND location_city IS NOT NULL
      GROUP BY location_city, location_country
    ),
    journal_places AS (
      SELECT DISTINCT je.location_city, je.location_country
      FROM journal_entries je
      JOIN journals j ON j.id = je.journal_id
      WHERE j.user_id = ${userId}::uuid
        AND je.is_deleted = false
        AND j.is_deleted = false
        AND je.location_city IS NOT NULL
    )
    SELECT
      ps.*,
      CASE WHEN jp.location_city IS NOT NULL THEN true ELSE false END AS has_journal
    FROM place_stats ps
    LEFT JOIN journal_places jp ON ps.location_city = jp.location_city AND ps.location_country = jp.location_country
    ORDER BY ps.latest_visit DESC
    LIMIT 50
  `;

  const now = Date.now();

  return places.map((p) => {
    const daysSinceVisit = (now - new Date(p.latest_visit).getTime()) / 86400000;
    const recencyScore = Math.max(0, 1 - daysSinceVisit / 365);
    const densityScore = Math.min(1, Number(p.post_count) / 10);
    const richnessScore = p.has_journal ? 1 : 0.5;
    const resonance = recencyScore * 0.4 + densityScore * 0.35 + richnessScore * 0.25;

    return {
      locationCity: p.location_city,
      locationCountry: p.location_country,
      locationName: p.location_name,
      lat: Number(p.location_lat),
      lng: Number(p.location_lng),
      postCount: Number(p.post_count),
      latestVisit: new Date(p.latest_visit).toISOString(),
      firstVisit: new Date(p.first_visit).toISOString(),
      hasJournal: p.has_journal,
      thumbnail: p.thumbnail,
      resonance: Math.round(resonance * 100) / 100,
    };
  });
}

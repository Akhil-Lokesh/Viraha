import { prisma } from '../lib/prisma';

interface PostCluster {
  postIds: string[];
  startDate: Date;
  endDate: Date;
  title: string;
  coverImage: string | null;
}

const CLUSTER_GAP_DAYS = 3; // Max days between posts in same journey
const MIN_POSTS_FOR_JOURNEY = 2;

/**
 * Detect journeys from a user's posts using temporal + spatial clustering.
 * Groups posts that are close in time and away from the user's home location.
 */
export async function detectJourneys(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { homeLat: true, homeLng: true },
  });

  // Get all posts ordered by date
  const posts = await prisma.post.findMany({
    where: { userId, isDeleted: false },
    orderBy: { postedAt: 'asc' },
    select: {
      id: true,
      locationLat: true,
      locationLng: true,
      locationCity: true,
      locationCountry: true,
      locationName: true,
      mediaUrls: true,
      mediaThumbnails: true,
      postedAt: true,
    },
  });

  if (posts.length < MIN_POSTS_FOR_JOURNEY) return 0;

  // Get existing journey post IDs to avoid duplicates
  const existingJourneyPosts = await prisma.journeyPost.findMany({
    where: { journey: { userId, isDeleted: false } },
    select: { postId: true },
  });
  const alreadyInJourney = new Set(existingJourneyPosts.map((jp) => jp.postId));

  // Filter out posts already in journeys
  const unassigned = posts.filter((p) => !alreadyInJourney.has(p.id));
  if (unassigned.length < MIN_POSTS_FOR_JOURNEY) return 0;

  // Filter out posts near home (if home is set)
  const awayPosts = user?.homeLat && user?.homeLng
    ? unassigned.filter((p) => {
        const dist = Math.sqrt(
          Math.pow(Number(p.locationLat) - Number(user.homeLat), 2) +
          Math.pow(Number(p.locationLng) - Number(user.homeLng), 2)
        );
        return dist > 0.5; // ~50km threshold
      })
    : unassigned;

  if (awayPosts.length < MIN_POSTS_FOR_JOURNEY) return 0;

  // Temporal clustering
  const clusters: PostCluster[] = [];
  let currentCluster: typeof awayPosts = [awayPosts[0]];

  for (let i = 1; i < awayPosts.length; i++) {
    const prev = awayPosts[i - 1];
    const curr = awayPosts[i];
    const dayGap = (curr.postedAt.getTime() - prev.postedAt.getTime()) / 86400000;

    if (dayGap <= CLUSTER_GAP_DAYS) {
      currentCluster.push(curr);
    } else {
      if (currentCluster.length >= MIN_POSTS_FOR_JOURNEY) {
        clusters.push(clusterToJourney(currentCluster));
      }
      currentCluster = [curr];
    }
  }
  if (currentCluster.length >= MIN_POSTS_FOR_JOURNEY) {
    clusters.push(clusterToJourney(currentCluster));
  }

  // Create journeys
  let created = 0;
  for (const cluster of clusters) {
    const journey = await prisma.journey.create({
      data: {
        userId,
        title: cluster.title,
        coverImage: cluster.coverImage,
        startDate: cluster.startDate,
        endDate: cluster.endDate,
        status: 'auto',
        journeyPosts: {
          create: cluster.postIds.map((postId, i) => ({
            postId,
            sortOrder: i,
          })),
        },
      },
    });
    if (journey) created++;
  }

  return created;
}

function clusterToJourney(posts: Array<{
  id: string;
  locationCity: string | null;
  locationCountry: string | null;
  locationName: string | null;
  mediaThumbnails: string[];
  mediaUrls: string[];
  postedAt: Date;
}>): PostCluster {
  // Generate title from most common city/country
  const cities = posts
    .map((p) => p.locationCity)
    .filter(Boolean) as string[];
  const countries = posts
    .map((p) => p.locationCountry)
    .filter(Boolean) as string[];

  const uniqueCities = [...new Set(cities)];
  const uniqueCountries = [...new Set(countries)];

  let title: string;
  if (uniqueCities.length === 1) {
    title = `Your trip to ${uniqueCities[0]}`;
  } else if (uniqueCities.length <= 3) {
    title = `Your trip to ${uniqueCities.join(', ')}`;
  } else if (uniqueCountries.length === 1) {
    title = `Your trip to ${uniqueCountries[0]}`;
  } else {
    title = `Your ${uniqueCountries.join(' & ')} journey`;
  }

  const cover = posts.find((p) => p.mediaThumbnails.length > 0 || p.mediaUrls.length > 0);

  return {
    postIds: posts.map((p) => p.id),
    startDate: posts[0].postedAt,
    endDate: posts[posts.length - 1].postedAt,
    title,
    coverImage: cover?.mediaThumbnails[0] || cover?.mediaUrls[0] || null,
  };
}

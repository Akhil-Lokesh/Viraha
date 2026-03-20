import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export async function handleGetAtlas(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;

    // Countries and cities visited
    const countryStats = await prisma.$queryRaw<Array<{
      location_country: string;
      city_count: bigint;
      post_count: bigint;
    }>>`
      SELECT
        location_country,
        COUNT(DISTINCT location_city) AS city_count,
        COUNT(*) AS post_count
      FROM posts
      WHERE user_id = ${userId}::uuid
        AND is_deleted = false
        AND location_country IS NOT NULL
      GROUP BY location_country
      ORDER BY post_count DESC
    `;

    // Cities visited
    const cityStats = await prisma.$queryRaw<Array<{
      location_city: string;
      location_country: string;
      post_count: bigint;
      first_visit: Date;
      latest_visit: Date;
    }>>`
      SELECT
        location_city,
        location_country,
        COUNT(*) AS post_count,
        MIN(posted_at) AS first_visit,
        MAX(posted_at) AS latest_visit
      FROM posts
      WHERE user_id = ${userId}::uuid
        AND is_deleted = false
        AND location_city IS NOT NULL
      GROUP BY location_city, location_country
      ORDER BY post_count DESC
    `;

    // Continent mapping (simplified)
    const continentMap: Record<string, string> = {
      // Major countries mapped to continents
      'United States': 'North America', 'Canada': 'North America', 'Mexico': 'North America',
      'Brazil': 'South America', 'Argentina': 'South America', 'Colombia': 'South America', 'Peru': 'South America', 'Chile': 'South America',
      'United Kingdom': 'Europe', 'France': 'Europe', 'Germany': 'Europe', 'Italy': 'Europe', 'Spain': 'Europe',
      'Portugal': 'Europe', 'Netherlands': 'Europe', 'Belgium': 'Europe', 'Switzerland': 'Europe', 'Austria': 'Europe',
      'Greece': 'Europe', 'Turkey': 'Europe', 'Sweden': 'Europe', 'Norway': 'Europe', 'Denmark': 'Europe',
      'Ireland': 'Europe', 'Poland': 'Europe', 'Czech Republic': 'Europe', 'Hungary': 'Europe', 'Croatia': 'Europe',
      'Japan': 'Asia', 'China': 'Asia', 'India': 'Asia', 'Thailand': 'Asia', 'Vietnam': 'Asia',
      'South Korea': 'Asia', 'Indonesia': 'Asia', 'Malaysia': 'Asia', 'Singapore': 'Asia', 'Philippines': 'Asia',
      'Sri Lanka': 'Asia', 'Nepal': 'Asia', 'Cambodia': 'Asia', 'Myanmar': 'Asia', 'Laos': 'Asia',
      'UAE': 'Asia', 'Israel': 'Asia', 'Jordan': 'Asia', 'Saudi Arabia': 'Asia',
      'Australia': 'Oceania', 'New Zealand': 'Oceania', 'Fiji': 'Oceania',
      'Egypt': 'Africa', 'Morocco': 'Africa', 'South Africa': 'Africa', 'Kenya': 'Africa', 'Tanzania': 'Africa',
      'Nigeria': 'Africa', 'Ghana': 'Africa', 'Ethiopia': 'Africa',
    };

    const continents = new Set<string>();
    const countries = countryStats.map((c) => {
      const continent = continentMap[c.location_country] || 'Other';
      continents.add(continent);
      return {
        country: c.location_country,
        continent,
        cityCount: Number(c.city_count),
        postCount: Number(c.post_count),
      };
    });

    const cities = cityStats.map((c) => ({
      city: c.location_city,
      country: c.location_country,
      postCount: Number(c.post_count),
      firstVisit: c.first_visit.toISOString(),
      latestVisit: c.latest_visit.toISOString(),
    }));

    // Travel style classification
    const totalPosts = countries.reduce((sum, c) => sum + c.postCount, 0);
    const totalCountries = countries.length;
    const totalCities = cities.length;
    const totalContinents = continents.size;

    let travelStyle = 'Explorer';
    if (totalContinents >= 4) travelStyle = 'Globe Trotter';
    else if (totalCountries >= 10) travelStyle = 'World Wanderer';
    else if (totalCities >= 20) travelStyle = 'City Collector';
    else if (totalCountries <= 3 && totalCities >= 5) travelStyle = 'Deep Diver';
    else if (totalPosts >= 50) travelStyle = 'Memory Maker';

    // Journal stats
    const journalCount = await prisma.journal.count({
      where: { userId, isDeleted: false },
    });
    const entryCount = await prisma.journalEntry.count({
      where: { journal: { userId, isDeleted: false }, isDeleted: false },
    });

    res.json({
      success: true,
      data: {
        countries,
        cities,
        stats: {
          totalCountries,
          totalCities,
          totalContinents,
          totalPosts,
          totalJournals: journalCount,
          totalEntries: entryCount,
          continentsVisited: [...continents],
        },
        travelStyle,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function handleGetSeasonalReflection(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const now = new Date();
    const seasonStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const seasonEnd = new Date(seasonStart);
    seasonEnd.setMonth(seasonEnd.getMonth() + 3);

    const posts = await prisma.post.count({
      where: {
        userId,
        isDeleted: false,
        postedAt: { gte: seasonStart, lt: seasonEnd },
      },
    });

    const newCities = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(DISTINCT location_city) AS count
      FROM posts
      WHERE user_id = ${userId}::uuid
        AND is_deleted = false
        AND posted_at >= ${seasonStart}
        AND posted_at < ${seasonEnd}
        AND location_city IS NOT NULL
    `;

    const journals = await prisma.journal.count({
      where: {
        userId,
        isDeleted: false,
        createdAt: { gte: seasonStart, lt: seasonEnd },
      },
    });

    const topPhotos = await prisma.post.findMany({
      where: {
        userId,
        isDeleted: false,
        postedAt: { gte: seasonStart, lt: seasonEnd },
      },
      orderBy: { saveCount: 'desc' },
      take: 6,
      select: {
        id: true,
        mediaThumbnails: true,
        mediaUrls: true,
        locationName: true,
        caption: true,
      },
    });

    const seasons = ['Winter', 'Spring', 'Summer', 'Autumn'];
    const seasonIndex = Math.floor(now.getMonth() / 3);

    res.json({
      success: true,
      data: {
        season: seasons[seasonIndex],
        year: now.getFullYear(),
        stats: {
          postsCreated: posts,
          newCitiesVisited: Number(newCities[0]?.count || 0),
          journalsWritten: journals,
        },
        highlights: topPhotos.map((p) => ({
          id: p.id,
          thumbnail: p.mediaThumbnails[0] || p.mediaUrls[0] || null,
          locationName: p.locationName,
          caption: p.caption,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

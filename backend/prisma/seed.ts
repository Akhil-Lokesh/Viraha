import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;
const DEFAULT_PASSWORD = 'password123';

// Unsplash photos for realistic content
const PHOTOS = {
  travel: [
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80',
    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80',
    'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800&q=80',
    'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800&q=80',
    'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80',
    'https://images.unsplash.com/photo-1518098268026-4e89f1a2cd8e?w=800&q=80',
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80',
    'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&q=80',
    'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=800&q=80',
    'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&q=80',
    'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&q=80',
    'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80',
    'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80',
    'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=800&q=80',
    'https://images.unsplash.com/photo-1433838552652-f9a46b332c40?w=800&q=80',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80',
    'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800&q=80',
    'https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=800&q=80',
  ],
  avatars: [
    'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&q=80',
  ],
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function slug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ─── User definitions ───────────────────────────────────

const users = [
  {
    username: 'anya',
    email: 'anya@viraha.com',
    displayName: 'Anya Sharma',
    bio: 'Solo traveler. Chasing sunsets across South Asia and beyond.',
    homeCity: 'Mumbai',
    homeCountry: 'India',
    homeLat: 19.076,
    homeLng: 72.8777,
    avatar: PHOTOS.avatars[0],
  },
  {
    username: 'marco',
    email: 'marco@viraha.com',
    displayName: 'Marco Rossi',
    bio: 'Italian photographer wandering through Europe one cobblestone at a time.',
    homeCity: 'Rome',
    homeCountry: 'Italy',
    homeLat: 41.9028,
    homeLng: 12.4964,
    avatar: PHOTOS.avatars[1],
  },
  {
    username: 'luna',
    email: 'luna@viraha.com',
    displayName: 'Luna Chen',
    bio: 'Digital nomad & tea enthusiast. Currently somewhere in Southeast Asia.',
    homeCity: 'Taipei',
    homeCountry: 'Taiwan',
    homeLat: 25.033,
    homeLng: 121.5654,
    avatar: PHOTOS.avatars[2],
  },
  {
    username: 'kai',
    email: 'kai@viraha.com',
    displayName: 'Kai Nakamura',
    bio: 'Mountain climber, ocean swimmer, story collector.',
    homeCity: 'Tokyo',
    homeCountry: 'Japan',
    homeLat: 35.6762,
    homeLng: 139.6503,
    avatar: PHOTOS.avatars[3],
  },
  {
    username: 'elena',
    email: 'elena@viraha.com',
    displayName: 'Elena Petrova',
    bio: 'Architecture lover. I travel to see how people build their worlds.',
    homeCity: 'Barcelona',
    homeCountry: 'Spain',
    homeLat: 41.3874,
    homeLng: 2.1686,
    avatar: PHOTOS.avatars[4],
    isPrivate: true,
  },
  {
    username: 'sam',
    email: 'sam@viraha.com',
    displayName: 'Sam Okafor',
    bio: 'Foodie explorer. Every city is a menu waiting to be tasted.',
    homeCity: 'Lagos',
    homeCountry: 'Nigeria',
    homeLat: 6.5244,
    homeLng: 3.3792,
    avatar: PHOTOS.avatars[5],
  },
  {
    username: 'mira',
    email: 'mira@viraha.com',
    displayName: 'Mira Johansson',
    bio: 'Northern lights chaser. Happiest above the Arctic Circle.',
    homeCity: 'Stockholm',
    homeCountry: 'Sweden',
    homeLat: 59.3293,
    homeLng: 18.0686,
    avatar: PHOTOS.avatars[6],
  },
  {
    username: 'diego',
    email: 'diego@viraha.com',
    displayName: 'Diego Alvarez',
    bio: 'Backpacking Latin America. Living slow, traveling far.',
    homeCity: 'Buenos Aires',
    homeCountry: 'Argentina',
    homeLat: -34.6037,
    homeLng: -58.3816,
    avatar: PHOTOS.avatars[7],
  },
];

// ─── Post definitions ───────────────────────────────────

const postTemplates = [
  // Anya's posts (idx 0-2)
  { userIdx: 0, caption: 'Golden hour at Goa. The Arabian Sea never disappoints.', lat: 15.2993, lng: 74.124, city: 'Goa', country: 'India', name: 'Palolem Beach', tags: ['beach', 'goa', 'sunset'], photo: 0 },
  { userIdx: 0, caption: 'Lost in the backstreets of Varanasi. Every corner tells a thousand-year-old story.', lat: 25.3176, lng: 83.0068, city: 'Varanasi', country: 'India', name: 'Varanasi Ghats', tags: ['culture', 'india', 'spiritual'], photo: 18 },
  { userIdx: 0, caption: 'Sri Lanka exceeded every expectation. The kindness of strangers here is unreal.', lat: 7.9537, lng: 80.7536, city: 'Sigiriya', country: 'Sri Lanka', name: 'Sigiriya Rock', tags: ['srilanka', 'history', 'adventure'], photo: 15 },
  // Marco's posts (idx 3-6)
  { userIdx: 1, caption: 'Venice in the fog is a completely different city. Hauntingly beautiful.', lat: 45.4408, lng: 12.3155, city: 'Venice', country: 'Italy', name: 'Piazza San Marco', tags: ['venice', 'fog', 'photography'], photo: 3 },
  { userIdx: 1, caption: 'Cinque Terre at sunset. The colors are not edited, I promise.', lat: 44.1265, lng: 9.7098, city: 'Cinque Terre', country: 'Italy', name: 'Manarola', tags: ['cinqueterre', 'italy', 'coast'], photo: 10 },
  { userIdx: 1, caption: 'Crossing the Alps by train. Window seat is mandatory.', lat: 46.7942, lng: 10.141, city: 'Brenner Pass', country: 'Austria', name: 'Brenner Railway', tags: ['alps', 'train', 'mountains'], photo: 16 },
  { userIdx: 1, caption: 'Paris never gets old. Found this quiet corner near Montmartre.', lat: 48.8867, lng: 2.3431, city: 'Paris', country: 'France', name: 'Montmartre', tags: ['paris', 'france', 'photography'], photo: 2 },
  // Luna's posts (idx 7-9)
  { userIdx: 2, caption: 'Bali rice terraces at dawn. Worth the 4am alarm.', lat: -8.4095, lng: 115.1889, city: 'Ubud', country: 'Indonesia', name: 'Tegallalang Rice Terraces', tags: ['bali', 'nature', 'sunrise'], photo: 13 },
  { userIdx: 2, caption: 'Co-working from a beach cafe in Koh Lanta. This is the life.', lat: 7.6508, lng: 99.0289, city: 'Koh Lanta', country: 'Thailand', name: 'Lanta Old Town', tags: ['digitalnomad', 'thailand', 'worklife'], photo: 4 },
  { userIdx: 2, caption: 'Hanoi street food tour. My taste buds will never be the same.', lat: 21.0278, lng: 105.8342, city: 'Hanoi', country: 'Vietnam', name: 'Old Quarter', tags: ['vietnam', 'streetfood', 'hanoi'], photo: 8 },
  // Kai's posts (idx 10-12)
  { userIdx: 3, caption: 'Summit of Mt. Fuji at sunrise. 8 hours of climbing for this one moment.', lat: 35.3606, lng: 138.7274, city: 'Fuji', country: 'Japan', name: 'Mt. Fuji Summit', tags: ['fuji', 'hiking', 'sunrise'], photo: 16 },
  { userIdx: 3, caption: 'Kyoto in autumn. The temples disappear under a canopy of red and gold.', lat: 35.0116, lng: 135.7681, city: 'Kyoto', country: 'Japan', name: 'Kinkaku-ji', tags: ['kyoto', 'autumn', 'temple'], photo: 5 },
  { userIdx: 3, caption: 'Diving in the Maldives. Saw a manta ray the size of a car.', lat: 4.1755, lng: 73.5093, city: 'Malé', country: 'Maldives', name: 'South Malé Atoll', tags: ['maldives', 'diving', 'ocean'], photo: 0 },
  // Elena's posts (idx 13-14)
  { userIdx: 4, caption: 'Gaudí\'s Barcelona is a fever dream in stone. La Sagrada Familia still takes my breath away after 50 visits.', lat: 41.4036, lng: 2.1744, city: 'Barcelona', country: 'Spain', name: 'Sagrada Familia', tags: ['gaudi', 'architecture', 'barcelona'], photo: 11 },
  { userIdx: 4, caption: 'Santorini. Where every building is a postcard.', lat: 36.3932, lng: 25.4615, city: 'Santorini', country: 'Greece', name: 'Oia', tags: ['santorini', 'greece', 'architecture'], photo: 6 },
  // Sam's posts (idx 15-17)
  { userIdx: 5, caption: 'Jollof rice wars: Ghana vs Nigeria edition. (Nigeria wins, obviously.)', lat: 6.4541, lng: 3.3947, city: 'Lagos', country: 'Nigeria', name: 'Lekki', tags: ['food', 'lagos', 'jollof'], photo: 14 },
  { userIdx: 5, caption: 'Marrakech souks are sensory overload in the best way. Spices, colors, sounds everywhere.', lat: 31.63, lng: -7.9811, city: 'Marrakech', country: 'Morocco', name: 'Jemaa el-Fnaa', tags: ['morocco', 'marrakech', 'food'], photo: 18 },
  { userIdx: 5, caption: 'Istanbul at dusk. The call to prayer echoing across the Bosphorus.', lat: 41.0082, lng: 28.9784, city: 'Istanbul', country: 'Turkey', name: 'Galata Bridge', tags: ['istanbul', 'turkey', 'culture'], photo: 12 },
  // Mira's posts (idx 18-20)
  { userIdx: 6, caption: 'Northern lights over Tromsø. No photo does this justice but I\'ll keep trying.', lat: 69.6496, lng: 18.9556, city: 'Tromsø', country: 'Norway', name: 'Tromsø Arctic', tags: ['northernlights', 'norway', 'arctic'], photo: 9 },
  { userIdx: 6, caption: 'Iceland\'s Ring Road. Day 3: waterfalls, volcanoes, and zero other humans.', lat: 63.6167, lng: -19.9917, city: 'Vik', country: 'Iceland', name: 'Black Sand Beach', tags: ['iceland', 'roadtrip', 'nature'], photo: 9 },
  { userIdx: 6, caption: 'Lofoten Islands. Where mountains meet the sea in the most dramatic way possible.', lat: 68.2128, lng: 14.1539, city: 'Lofoten', country: 'Norway', name: 'Reine', tags: ['lofoten', 'norway', 'fjords'], photo: 17 },
  // Diego's posts (idx 21-23)
  { userIdx: 7, caption: 'Patagonia. The end of the world looks like the beginning of everything.', lat: -50.3414, lng: -72.2648, city: 'El Chaltén', country: 'Argentina', name: 'Fitz Roy', tags: ['patagonia', 'hiking', 'mountains'], photo: 16 },
  { userIdx: 7, caption: 'Medellín transformed itself from the world\'s most dangerous city to one of its most vibrant. Inspiring.', lat: 6.2442, lng: -75.5812, city: 'Medellín', country: 'Colombia', name: 'Comuna 13', tags: ['colombia', 'medellin', 'culture'], photo: 19 },
  { userIdx: 7, caption: 'Salar de Uyuni. Walking on a mirror that reflects the sky.', lat: -20.1338, lng: -67.4891, city: 'Uyuni', country: 'Bolivia', name: 'Salar de Uyuni', tags: ['bolivia', 'saltflats', 'surreal'], photo: 15 },
];

// ─── Follow graph ───────────────────────────────────────
const followPairs: [number, number][] = [
  // Anya follows: Marco, Luna, Kai, Sam, Diego
  [0, 1], [0, 2], [0, 3], [0, 5], [0, 7],
  // Marco follows: Anya, Luna, Elena, Mira
  [1, 0], [1, 2], [1, 4], [1, 6],
  // Luna follows: Anya, Marco, Kai, Sam, Mira, Diego
  [2, 0], [2, 1], [2, 3], [2, 5], [2, 6], [2, 7],
  // Kai follows: Anya, Marco, Luna, Diego
  [3, 0], [3, 1], [3, 2], [3, 7],
  // Elena follows: Marco, Mira (she's private, selective)
  [4, 1], [4, 6],
  // Sam follows: Anya, Luna, Kai, Diego
  [5, 0], [5, 2], [5, 3], [5, 7],
  // Mira follows: Anya, Marco, Luna, Elena, Kai
  [6, 0], [6, 1], [6, 2], [6, 4], [6, 3],
  // Diego follows: Anya, Luna, Sam, Mira
  [7, 0], [7, 2], [7, 5], [7, 6],
];

// ─── Comment templates ──────────────────────────────────
const commentTexts = [
  'This is absolutely stunning!',
  'Adding this to my bucket list right now.',
  'I was there last year — brings back so many memories!',
  'The colors in this photo are unreal.',
  'How long did you stay here?',
  'This makes me want to book a flight immediately.',
  'Gorgeous! What camera did you use?',
  'I can almost feel the breeze looking at this.',
  'Travel goals. Saving this for later.',
  'The light in this shot is perfect.',
  'I need to visit this place someday.',
  'Such a beautiful perspective!',
  'Living vicariously through your posts.',
  'This is why I love Viraha — stories like this.',
  'Wow, just wow.',
];

// ─── Journal definitions ────────────────────────────────
const journalDefs = [
  {
    userIdx: 0,
    title: 'Three Weeks in Sri Lanka',
    summary: 'A journey through ancient ruins, misty hills, and coastal sunsets.',
    status: 'published',
    entries: [
      { title: 'Arriving in Colombo', content: 'The humidity hit me like a wall as I stepped off the plane. Colombo is chaos and charm all at once — tuk-tuks weaving through traffic, the smell of curry leaves from every corner.', mood: 'adventurous', city: 'Colombo', country: 'Sri Lanka', lat: 6.9271, lng: 79.8612 },
      { title: 'The Train to Ella', content: 'Everyone said this would be the highlight of the trip, and they were right. Nine hours of tea plantations, waterfalls, and bridges that seem to float in the clouds. I hung out the open door for most of it.', mood: 'inspired', city: 'Ella', country: 'Sri Lanka', lat: 6.8667, lng: 81.0466 },
      { title: 'Sigiriya at Dawn', content: 'Climbed the rock fortress before the crowds arrived. At the top, the entire jungle stretches out like a green ocean. The ancient frescoes on the way up are mind-blowing — 1,500 years old and still vivid.', mood: 'peaceful', city: 'Sigiriya', country: 'Sri Lanka', lat: 7.957, lng: 80.7603 },
    ],
  },
  {
    userIdx: 1,
    title: 'Mediterranean by Rail',
    summary: 'Slow-traveling the Mediterranean coast by train, from Barcelona to Istanbul.',
    status: 'published',
    entries: [
      { title: 'Barcelona — Day One', content: 'Started at La Boqueria market with a fresh juice and jamón ibérico. The Gothic Quarter is endlessly photogenic — every alley reveals a new courtyard or hidden church.', mood: 'adventurous', city: 'Barcelona', country: 'Spain', lat: 41.3874, lng: 2.1686 },
      { title: 'The French Riviera', content: 'Nice to Monaco by the coastal train. The Mediterranean is absurdly blue here — it looks photoshopped but it\'s real. Had the best socca of my life from a street vendor in Nice.', mood: 'grateful', city: 'Nice', country: 'France', lat: 43.7102, lng: 7.262 },
      { title: 'Rome', content: 'Coming home always feels different when you\'ve been away. Saw the Colosseum like a tourist for the first time in years. Sometimes you need to leave home to really see it.', mood: 'reflective', city: 'Rome', country: 'Italy', lat: 41.9028, lng: 12.4964 },
      { title: 'Athens', content: 'The Parthenon at sunset is worth every sweaty step up the Acropolis. Had dinner in Plaka where the waiter refused to give me a menu and just brought "the best things."', mood: 'grateful', city: 'Athens', country: 'Greece', lat: 37.9838, lng: 23.7275 },
    ],
  },
  {
    userIdx: 2,
    title: 'Digital Nomad Diaries: Southeast Asia',
    summary: 'Working remotely while island-hopping through Thailand, Vietnam, and Indonesia.',
    status: 'published',
    entries: [
      { title: 'Chiang Mai — Finding My Routine', content: 'Settled into a co-working space in Nimman. The community here is incredible — met developers, designers, and writers from 20 different countries in my first week.', mood: 'inspired', city: 'Chiang Mai', country: 'Thailand', lat: 18.7883, lng: 98.9853 },
      { title: 'Hanoi Hustle', content: 'Vietnam challenges every sense. The coffee is liquid heaven, the motorbikes are organized chaos, and the pho... I dream about the pho.', mood: 'adventurous', city: 'Hanoi', country: 'Vietnam', lat: 21.0278, lng: 105.8342 },
      { title: 'Bali Balance', content: 'Finally found the balance between work and wandering. Mornings: laptop at a rice terrace café. Afternoons: scootering to hidden waterfalls. This is sustainable.', mood: 'peaceful', city: 'Ubud', country: 'Indonesia', lat: -8.5069, lng: 115.2625 },
    ],
  },
  {
    userIdx: 7,
    title: 'Patagonia: Edge of the World',
    summary: 'Hiking the southern tip of South America through wind, ice, and endless sky.',
    status: 'published',
    entries: [
      { title: 'El Chaltén', content: 'The trekking capital of Argentina lives up to its name. Fitz Roy revealed itself through the clouds after three days of waiting. The patience was worth it — tears-in-your-eyes worth it.', mood: 'inspired', city: 'El Chaltén', country: 'Argentina', lat: -49.3315, lng: -72.886 },
      { title: 'Perito Moreno Glacier', content: 'Standing in front of a wall of ice the size of Buenos Aires is a humbling experience. Every few minutes, a chunk the size of a building calves off with a thunderous crack.', mood: 'peaceful', city: 'El Calafate', country: 'Argentina', lat: -50.4967, lng: -73.0467 },
      { title: 'Torres del Paine', content: 'Crossed into Chile for the W Trek. Four days of the most dramatic landscapes I\'ve ever seen. Wind nearly knocked me off a ridge on day 2. Worth every terrifying second.', mood: 'adventurous', city: 'Torres del Paine', country: 'Chile', lat: -51.0, lng: -73.0 },
    ],
  },
  {
    userIdx: 6,
    title: 'Chasing Aurora: Arctic Winter',
    summary: 'A month above the Arctic Circle hunting the northern lights.',
    status: 'draft',
    entries: [
      { title: 'Tromsø Arrival', content: 'The polar night is surreal — the sun doesn\'t rise but the sky cycles through shades of blue and purple. Tromsø itself is cozy: wooden houses, warm cafés, and everyone wearing wool.', mood: 'reflective', city: 'Tromsø', country: 'Norway', lat: 69.6496, lng: 18.9556 },
      { title: 'First Aurora', content: 'It happened on night three. Green ribbons dancing across the entire sky, shifting and pulsing like something alive. I stood in -20°C for two hours and didn\'t feel the cold once.', mood: 'inspired', city: 'Tromsø', country: 'Norway', lat: 69.6496, lng: 18.9556 },
    ],
  },
];

// ─── Album definitions ──────────────────────────────────
const albumDefs = [
  { userIdx: 1, title: 'Italian Moments', description: 'A curated collection of my favorite shots from across Italy.' },
  { userIdx: 0, title: 'Sacred India', description: 'Temples, ghats, and quiet moments of devotion.' },
  { userIdx: 2, title: 'Café Offices', description: 'Every café I\'ve worked from across Asia.' },
  { userIdx: 7, title: 'Mountain Views', description: 'Peaks, ridges, and everything above the clouds.' },
];

// ─────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding Viraha database...\n');

  // Clean existing data (order matters for FK constraints)
  await prisma.activity.deleteMany();
  await prisma.save.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.albumPost.deleteMany();
  await prisma.album.deleteMany();
  await prisma.journalEntry.deleteMany();
  await prisma.journal.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.report.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  console.log('  Cleaned existing data.');

  // 1. Create users
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

  const createdUsers = await Promise.all(
    users.map((u) =>
      prisma.user.create({
        data: {
          username: u.username,
          email: u.email,
          passwordHash,
          displayName: u.displayName,
          bio: u.bio,
          avatar: u.avatar,
          homeCity: u.homeCity,
          homeCountry: u.homeCountry,
          homeLat: u.homeLat,
          homeLng: u.homeLng,
          isPrivate: (u as any).isPrivate ?? false,
          emailVerified: true,
        },
      })
    )
  );

  // Also re-create demo user with same password
  await prisma.user.upsert({
    where: { email: 'demo@viraha.com' },
    update: { passwordHash },
    create: {
      username: 'demo',
      email: 'demo@viraha.com',
      passwordHash,
      displayName: 'Demo Traveler',
      emailVerified: true,
    },
  });

  console.log(`  ✓ Created ${createdUsers.length + 1} users (including demo)`);

  // 2. Create follows
  const followData = followPairs.map(([fi, fgi]) => ({
    followerId: createdUsers[fi].id,
    followingId: createdUsers[fgi].id,
    status: 'accepted',
  }));

  await prisma.follow.createMany({ data: followData });
  console.log(`  ✓ Created ${followData.length} follow relationships`);

  // 3. Create posts
  const createdPosts: any[] = [];
  for (let i = 0; i < postTemplates.length; i++) {
    const t = postTemplates[i];
    const post = await prisma.post.create({
      data: {
        userId: createdUsers[t.userIdx].id,
        caption: t.caption,
        mediaUrls: [PHOTOS.travel[t.photo]],
        mediaThumbnails: [PHOTOS.travel[t.photo]],
        locationLat: t.lat,
        locationLng: t.lng,
        locationCity: t.city,
        locationCountry: t.country,
        locationName: t.name,
        tags: t.tags,
        privacy: 'public',
        postedAt: new Date(Date.now() - (postTemplates.length - i) * 3600000 * 6),
      },
    });
    createdPosts.push({ ...post, userIdx: t.userIdx });
  }

  console.log(`  ✓ Created ${createdPosts.length} posts`);

  // 4. Create comments
  let commentCount = 0;
  for (const [followerIdx, followingIdx] of followPairs) {
    const theirPosts = createdPosts.filter((p) => p.userIdx === followingIdx);
    if (theirPosts.length === 0) continue;

    const toComment = theirPosts.slice(0, Math.min(2, theirPosts.length));
    for (const post of toComment) {
      const comment = await prisma.comment.create({
        data: {
          postId: post.id,
          userId: createdUsers[followerIdx].id,
          text: pick(commentTexts),
        },
      });

      await prisma.post.update({
        where: { id: post.id },
        data: { commentCount: { increment: 1 } },
      });

      await prisma.activity.create({
        data: {
          userId: createdUsers[post.userIdx].id,
          actorId: createdUsers[followerIdx].id,
          type: 'comment',
          postId: post.id,
          commentId: comment.id,
        },
      });

      commentCount++;
    }
  }

  console.log(`  ✓ Created ${commentCount} comments`);

  // 5. Create saves
  let saveCount = 0;
  const savePairs: [number, number][] = [
    [0, 3], [0, 7], [0, 10],
    [1, 0], [1, 18], [1, 20],
    [2, 3], [2, 11], [2, 21],
    [3, 7], [3, 19],
    [5, 0], [5, 9], [5, 13],
    [6, 2], [6, 12], [6, 23],
    [7, 10], [7, 18], [7, 14],
  ];

  for (const [userIdx, postIdx] of savePairs) {
    if (postIdx >= createdPosts.length) continue;
    const post = createdPosts[postIdx];
    await prisma.save.create({
      data: {
        userId: createdUsers[userIdx].id,
        postId: post.id,
      },
    });
    await prisma.post.update({
      where: { id: post.id },
      data: { saveCount: { increment: 1 } },
    });

    if (post.userIdx !== userIdx) {
      await prisma.activity.create({
        data: {
          userId: createdUsers[post.userIdx].id,
          actorId: createdUsers[userIdx].id,
          type: 'save',
          postId: post.id,
        },
      });
    }
    saveCount++;
  }

  console.log(`  ✓ Created ${saveCount} saves`);

  // 6. Create follow activities
  for (const [followerIdx, followingIdx] of followPairs) {
    await prisma.activity.create({
      data: {
        userId: createdUsers[followingIdx].id,
        actorId: createdUsers[followerIdx].id,
        type: 'follow',
      },
    });
  }

  console.log(`  ✓ Created ${followPairs.length} follow activities`);

  // 7. Create albums
  let albumCount = 0;
  for (const def of albumDefs) {
    const userPosts = createdPosts.filter((p) => p.userIdx === def.userIdx);
    const album = await prisma.album.create({
      data: {
        userId: createdUsers[def.userIdx].id,
        title: def.title,
        description: def.description,
        slug: slug(def.title) + '-' + createdUsers[def.userIdx].username,
        coverImage: userPosts[0]?.mediaUrls[0] || null,
        postCount: Math.min(userPosts.length, 3),
      },
    });

    for (let i = 0; i < Math.min(userPosts.length, 3); i++) {
      await prisma.albumPost.create({
        data: {
          albumId: album.id,
          postId: userPosts[i].id,
          sortOrder: i,
        },
      });
    }
    albumCount++;
  }

  console.log(`  ✓ Created ${albumCount} albums`);

  // 8. Create journals with entries
  let journalCount = 0;
  let entryCount = 0;
  for (const jDef of journalDefs) {
    const journal = await prisma.journal.create({
      data: {
        userId: createdUsers[jDef.userIdx].id,
        title: jDef.title,
        summary: jDef.summary,
        slug: slug(jDef.title) + '-' + createdUsers[jDef.userIdx].username,
        status: jDef.status,
        privacy: 'public',
        entryCount: jDef.entries.length,
        coverImage: pick(PHOTOS.travel),
      },
    });

    for (let i = 0; i < jDef.entries.length; i++) {
      const e = jDef.entries[i];
      await prisma.journalEntry.create({
        data: {
          journalId: journal.id,
          title: e.title,
          content: e.content,
          mood: e.mood,
          locationCity: e.city,
          locationCountry: e.country,
          locationLat: e.lat,
          locationLng: e.lng,
          sortOrder: i,
          date: new Date(Date.now() - (jDef.entries.length - i) * 86400000 * 2),
          mediaUrls: [pick(PHOTOS.travel)],
        },
      });
      entryCount++;
    }
    journalCount++;
  }

  console.log(`  ✓ Created ${journalCount} journals with ${entryCount} entries`);

  // Done!
  console.log('\n✅ Seed complete!\n');
  console.log('┌──────────────────────────────────────────────┐');
  console.log('│  Login Credentials (all use same password)   │');
  console.log('│  Password: password123                       │');
  console.log('├──────────────────────────────────────────────┤');
  for (const u of users) {
    const line = `│  ${u.email.padEnd(26)} @${u.username.padEnd(10)} │`;
    console.log(line);
  }
  console.log('│                                              │');
  console.log('│  demo@viraha.com           @demo       │');
  console.log('│  (empty account for testing fresh UX)        │');
  console.log('├──────────────────────────────────────────────┤');
  console.log('│  elena (@elena) is a PRIVATE account         │');
  console.log('└──────────────────────────────────────────────┘');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

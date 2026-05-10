const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "data.json");

const projects = [
  {
    title: "Luminous Glow",
    slug: "luminous-glow",
    category: "Animation",
    subcategories: ["Abstract", "Glow"],
    artistRoles: ["Direction", "Animation"],
    imageUrl: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853",
    videoUrl:
      "https://cdn.pixabay.com/vimeo/312061327/abstract-21151.mp4?width=1280&hash=8b51d5c7f8a7e4b2d5a8e4b2d5a8e4b2d5a8e4b2",
    description: "A luminous journey through abstract particles.",
    artist: "Noisegraph",
    artistSlug: "noisegraph",
  },
  {
    title: "Cybernetic Dreams",
    slug: "cybernetic-dreams",
    category: "CGI",
    subcategories: ["Futuristic", "Character Work"],
    artistRoles: ["CGI", "Compositing"],
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe",
    videoUrl:
      "https://cdn.pixabay.com/vimeo/312061327/abstract-21151.mp4?width=1280&hash=8b51d5c7f8a7e4b2d5a8e4b2d5a8e4b2d5a8e4b2",
    description: "Future aesthetics in motion.",
    artist: "Ben Fearnley",
    artistSlug: "ben-fearnley",
  },
  {
    title: "Fluid Structures",
    slug: "fluid-structures",
    category: "Design",
    subcategories: ["Editorial", "Minimal"],
    artistRoles: ["Design", "Motion"],
    imageUrl: "https://images.unsplash.com/photo-1614850523060-8da1d56ae167",
    videoUrl:
      "https://cdn.pixabay.com/vimeo/312061327/abstract-21151.mp4?width=1280&hash=8b51d5c7f8a7e4b2d5a8e4b2d5a8e4b2d5a8e4b2",
    description: "Dynamic liquid simulations.",
    artist: "Arcade Studio",
    artistSlug: "arcade-studio",
  },
];

const artists = [
  {
    name: "Noisegraph",
    slug: "noisegraph",
    slogan: "Motion Masters",
    bio: "Expert in particle simulations.",
  },
  {
    name: "Ben Fearnley",
    slug: "ben-fearnley",
    slogan: "CGI Specialist",
    bio: "Pushing the boundaries of realistic CGI.",
  },
  {
    name: "Arcade Studio",
    slug: "arcade-studio",
    slogan: "Design Thinkers",
    bio: "Merging art and technology.",
  },
];

const current = fs.existsSync(dataPath)
  ? JSON.parse(fs.readFileSync(dataPath, "utf8"))
  : { projects: [], artists: [] };

const existingProjectSlugs = new Set(
  (current.projects || []).map((p) => p.slug),
);
const existingArtistSlugs = new Set((current.artists || []).map((a) => a.slug));

let nextProjectId =
  (current.projects || []).reduce(
    (max, p) => Math.max(max, Number(p.id) || 0),
    0,
  ) + 1;
let nextArtistId =
  (current.artists || []).reduce(
    (max, a) => Math.max(max, Number(a.id) || 0),
    0,
  ) + 1;

for (const project of projects) {
  if (existingProjectSlugs.has(project.slug)) continue;
  current.projects.push({
    ...project,
    id: nextProjectId++,
    createdAt: new Date().toISOString(),
  });
}

for (const artist of artists) {
  if (existingArtistSlugs.has(artist.slug)) continue;
  current.artists.push({
    ...artist,
    id: nextArtistId++,
    createdAt: new Date().toISOString(),
  });
}

fs.writeFileSync(dataPath, JSON.stringify(current, null, 2), "utf8");
console.log("Data store seeded successfully.");

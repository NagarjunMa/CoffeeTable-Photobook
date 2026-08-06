import type { Collection, PortfolioImage } from "./types";

const image = (
  id: string,
  src: string,
  width: number,
  height: number,
  alt: string,
): PortfolioImage => ({
  id,
  fileName: `${id}.jpg`,
  src,
  width,
  height,
  alt,
  orientation:
    width === height ? "square" : width > height ? "landscape" : "portrait",
});

export const sampleCollections: Collection[] = [
  {
    title: "Badami",
    slug: "badami",
    location: "Karnataka, India",
    year: "Origin Study",
    note: "Stone, family memory, and the first understanding that a photograph can become complete without explanation.",
    images: [
      image(
        "badami-01",
        "https://images.unsplash.com/photo-1626014303757-6366ef55c4ab?auto=format&fit=crop&w=1600&q=85",
        1200,
        1600,
        "Ancient sandstone architecture in warm evening light",
      ),
      image(
        "badami-02",
        "https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&w=1800&q=85",
        1800,
        1200,
        "Temple corridor and carved stone details",
      ),
      image(
        "badami-03",
        "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1600&q=85",
        1200,
        1500,
        "Quiet architectural detail framed against the sky",
      ),
      image(
        "badami-04",
        "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1800&q=85",
        1800,
        1200,
        "Historic stone structure with human scale",
      ),
    ],
  },
  {
    title: "Bandipur",
    slug: "bandipur",
    location: "Karnataka, India",
    year: "Forest Notes",
    note: "A quieter search for patience, distance, and the animal shape hidden inside the landscape.",
    images: [
      image(
        "bandipur-01",
        "https://images.unsplash.com/photo-1549366021-9f761d040a94?auto=format&fit=crop&w=1800&q=85",
        1800,
        1200,
        "Elephant moving through a forest clearing",
      ),
      image(
        "bandipur-02",
        "https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=1400&q=85",
        1100,
        1500,
        "Deer standing in muted forest light",
      ),
      image(
        "bandipur-03",
        "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1800&q=85",
        1800,
        1200,
        "Wildlife silhouette across dry grassland",
      ),
      image(
        "bandipur-04",
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=85",
        1800,
        1200,
        "Forest road passing through morning haze",
      ),
    ],
  },
  {
    title: "Varanasi",
    slug: "varanasi",
    location: "Uttar Pradesh, India",
    year: "River Light",
    note: "A study of still water, morning ritual, and the way silence survives inside a crowded place.",
    images: [
      image(
        "varanasi-01",
        "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1800&q=85",
        1800,
        1200,
        "Boats gathered along the river at sunrise",
      ),
      image(
        "varanasi-02",
        "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=1400&q=85",
        1200,
        1600,
        "Narrow city passage with layered morning light",
      ),
      image(
        "varanasi-03",
        "https://images.unsplash.com/photo-1599831069477-b2acdc0bcb91?auto=format&fit=crop&w=1800&q=85",
        1800,
        1200,
        "Riverbank architecture reflected in water",
      ),
      image(
        "varanasi-04",
        "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1800&q=85",
        1800,
        1200,
        "Historic Indian landmark in soft light",
      ),
    ],
  },
].map((collection) => ({
  ...collection,
  coverImages: [collection.images[0], collection.images[1]],
}));

import { notFound } from "next/navigation";
import { CollectionGallery } from "@/components/collection-gallery";
import { SiteHeader } from "@/components/site-header";
import { collections, getCollection } from "@/data/collections";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return collections.map((collection) => ({
    slug: collection.slug,
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const collection = getCollection(slug);

  if (!collection) {
    return {
      title: "Series Not Found",
    };
  }

  return {
    title: `${collection.title} - Photography Series`,
    description: collection.note,
  };
}

export default async function SeriesPage({ params }: PageProps) {
  const { slug } = await params;
  const collection = getCollection(slug);

  if (!collection) {
    notFound();
  }

  return (
    <>
      <SiteHeader theme="dark" position="absolute" />
      <main id="main-content" tabIndex={-1} className="page-shell">
        <CollectionGallery collection={collection} />
      </main>
    </>
  );
}

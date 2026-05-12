import { getPublishedPosts } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Nieuws | KHZS",
  description: "Nieuws en updates van KHZS",
};

export default function NieuwsPage() {
  const posts = getPublishedPosts();

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Nieuws</h1>

        {posts.length === 0 ? (
          <p className="text-gray-500 text-lg">Nog geen nieuwsberichten.</p>
        ) : (
          <div className="grid gap-8">
            {posts.map((post) => (
              <article
                key={post.id}
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                {post.uitgelichte_afbeelding && (
                  <div className="relative w-full h-48">
                    <Image
                      src={post.uitgelichte_afbeelding}
                      alt={post.titel}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <time className="text-sm text-gray-500">
                    {new Date(post.publicatiedatum).toLocaleDateString("nl-BE", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </time>
                  <h2 className="text-2xl font-semibold text-gray-900 mt-2 mb-3">
                    <Link
                      href={`/nieuws/${post.slug}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {post.titel}
                    </Link>
                  </h2>
                  <p className="text-gray-600 line-clamp-3">
                    {post.inhoud.replace(/<[^>]*>/g, "").slice(0, 200)}
                    {post.inhoud.length > 200 ? "..." : ""}
                  </p>
                  <Link
                    href={`/nieuws/${post.slug}`}
                    className="inline-block mt-4 text-blue-600 font-medium hover:underline"
                  >
                    Lees meer →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

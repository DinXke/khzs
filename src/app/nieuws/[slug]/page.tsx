import { getPostBySlug } from "@/lib/db";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function NieuwsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link
          href="/nieuws"
          className="text-blue-600 hover:underline mb-6 inline-block"
        >
          ← Terug naar nieuws
        </Link>

        <article>
          <header className="mb-8">
            <time className="text-sm text-gray-500">
              {new Date(post.publicatiedatum).toLocaleDateString("nl-BE", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </time>
            <h1 className="text-4xl font-bold text-gray-900 mt-2">{post.titel}</h1>
          </header>

          {post.uitgelichte_afbeelding && (
            <div className="relative w-full h-64 mb-8 rounded-lg overflow-hidden">
              <Image
                src={post.uitgelichte_afbeelding}
                alt={post.titel}
                fill
                className="object-cover"
              />
            </div>
          )}

          <div
            className="prose prose-lg max-w-none text-gray-800"
            dangerouslySetInnerHTML={{ __html: post.inhoud }}
          />
        </article>
      </div>
    </main>
  );
}

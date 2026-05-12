import { getPostById } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BlogForm } from "../../BlogForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Bericht bewerken | Admin",
};

export default async function BewerkenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = getPostById(Number(id));

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/admin/blog" className="text-blue-600 hover:underline text-sm">
            ← Terug naar overzicht
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Bericht bewerken</h1>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <BlogForm
            mode="bewerken"
            initialData={{
              id: post.id,
              titel: post.titel,
              inhoud: post.inhoud,
              uitgelichte_afbeelding: post.uitgelichte_afbeelding ?? "",
              publicatiedatum: post.publicatiedatum,
              gepubliceerd: Boolean(post.gepubliceerd),
            }}
          />
        </div>
      </div>
    </div>
  );
}

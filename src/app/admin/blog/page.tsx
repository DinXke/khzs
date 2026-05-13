import { getAllPosts, type Blogpost } from "@/lib/db";
import Link from "next/link";
import { DeleteButton } from "./DeleteButton";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Blog beheer | Admin",
};

export default function AdminBlogPage() {
  let posts: Blogpost[] = [];
  try {
    posts = getAllPosts();
  } catch (error) {
    console.error("Fout bij ophalen blogberichten:", error);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Blog beheer</h1>
          <Link
            href="/admin/blog/nieuw"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            + Nieuw bericht
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">Nog geen blogberichten.</p>
            <Link
              href="/admin/blog/nieuw"
              className="text-blue-600 font-medium hover:underline"
            >
              Maak je eerste bericht aan
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Titel
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Datum
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{post.titel}</div>
                      <div className="text-sm text-gray-500">/nieuws/{post.slug}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(post.publicatiedatum).toLocaleDateString("nl-BE")}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          post.gepubliceerd
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {post.gepubliceerd ? "Gepubliceerd" : "Concept"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/nieuws/${post.slug}`}
                          className="text-sm text-gray-600 hover:text-gray-900"
                          target="_blank"
                        >
                          Bekijk
                        </Link>
                        <Link
                          href={`/admin/blog/${post.id}/bewerken`}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Bewerken
                        </Link>
                        <DeleteButton id={post.id} titel={post.titel} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

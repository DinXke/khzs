import { getPublishedPosts, type Blogpost } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Hasseltse Zwemvereniging Spartacus",
  description: "Hasseltse Zwemvereniging Spartacus - KHZS",
};

export default function HomePage() {
  let posts: Blogpost[] = [];
  try {
    posts = getPublishedPosts().slice(0, 6);
  } catch {
    // DB not yet initialized
  }

  return (
    <>
      <header style={{ backgroundColor: "#4a5f6d" }} className="text-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            <Link href="/" className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://khzs.be/wp-content/uploads/2016/08/logo.png"
                alt="KHZS Logo"
                width={60}
                height={36}
                style={{ height: 36, width: "auto" }}
              />
              <span className="font-bold text-lg leading-tight hidden sm:block">
                Hasseltse Zwemvereniging<br />
                <span style={{ color: "#ee546c" }}>Spartacus</span>
              </span>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link href="/" className="px-3 py-2 rounded hover:bg-white/10 transition-colors">
                Home
              </Link>
              <Link href="/nieuws" className="px-3 py-2 rounded hover:bg-white/10 transition-colors">
                Nieuws
              </Link>
              <a href="https://khzs.be/trainingsuren-competitie/" target="_blank" rel="noopener" className="px-3 py-2 rounded hover:bg-white/10 transition-colors hidden md:block">
                Competitie
              </a>
              <a href="https://khzs.be/zwemschool-algemene-informatie/" target="_blank" rel="noopener" className="px-3 py-2 rounded hover:bg-white/10 transition-colors hidden md:block">
                Zwemschool
              </a>
              <a href="https://khzs.be/vakantieperiodes/" target="_blank" rel="noopener" className="px-3 py-2 rounded hover:bg-white/10 transition-colors hidden lg:block">
                Vakantieperiodes
              </a>
              <Link
                href="/login"
                className="ml-2 px-3 py-1.5 rounded text-sm font-medium transition-colors"
                style={{ backgroundColor: "#ee546c" }}
              >
                Inloggen
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div style={{ backgroundColor: "#ee546c" }} className="text-white py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Hasseltse Zwemvereniging Spartacus
          </h1>
          <p className="text-lg opacity-90">
            Welkom bij KHZS — zwemclub voor competitie, zwemschool en recreatie in Hasselt
          </p>
        </div>
      </div>

      <main className="flex-1 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <h2 className="text-2xl font-bold mb-6" style={{ color: "#4a5f6d" }}>
            Laatste nieuws
          </h2>

          {posts.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
              <p className="text-gray-500">Nog geen nieuwsberichten. Log in als admin om berichten toe te voegen.</p>
              <Link href="/login" className="mt-4 inline-block font-medium" style={{ color: "#ee546c" }}>
                Inloggen →
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {post.uitgelichte_afbeelding && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.uitgelichte_afbeelding}
                      alt={post.titel}
                      className="w-full h-44 object-cover"
                    />
                  )}
                  <div className="p-5">
                    <time className="text-xs text-gray-400 uppercase tracking-wide">
                      {new Date(post.publicatiedatum).toLocaleDateString("nl-BE", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </time>
                    <h3 className="text-lg font-semibold mt-1 mb-2" style={{ color: "#4a5f6d" }}>
                      <Link href={`/nieuws/${post.slug}`} className="hover:underline">
                        {post.titel}
                      </Link>
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-3">
                      {post.inhoud.replace(/<[^>]*>/g, "").slice(0, 150)}
                      {post.inhoud.length > 150 ? "…" : ""}
                    </p>
                    <Link
                      href={`/nieuws/${post.slug}`}
                      className="inline-block mt-3 text-sm font-medium hover:underline"
                      style={{ color: "#ee546c" }}
                    >
                      Lees meer →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}

          {posts.length > 0 && (
            <div className="mt-8 text-center">
              <Link
                href="/nieuws"
                className="inline-block px-6 py-2 rounded font-medium text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: "#4a5f6d" }}
              >
                Alle nieuwsberichten
              </Link>
            </div>
          )}
        </div>

        <div className="max-w-6xl mx-auto px-4 pb-10">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-bold text-lg mb-2" style={{ color: "#4a5f6d" }}>🏊 Competitie</h3>
              <p className="text-gray-600 text-sm mb-3">Trainingsschema, documenten en clubrecords voor onze competitiezwemmers.</p>
              <a href="https://khzs.be/trainingsuren-competitie/" target="_blank" rel="noopener" className="text-sm font-medium hover:underline" style={{ color: "#ee546c" }}>
                Meer info →
              </a>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-bold text-lg mb-2" style={{ color: "#4a5f6d" }}>🎓 Zwemschool</h3>
              <p className="text-gray-600 text-sm mb-3">Van startersgroep tot pre-competitie — leer zwemmen bij KHZS Spartacus.</p>
              <a href="https://khzs.be/zwemschool-algemene-informatie/" target="_blank" rel="noopener" className="text-sm font-medium hover:underline" style={{ color: "#ee546c" }}>
                Meer info →
              </a>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-bold text-lg mb-2" style={{ color: "#4a5f6d" }}>📋 Lidgeld</h3>
              <p className="text-gray-600 text-sm mb-3">Informatie over lidgeld, jeugdfonds, mutualiteit en verzekering.</p>
              <a href="https://khzs.be/lidgeld/" target="_blank" rel="noopener" className="text-sm font-medium hover:underline" style={{ color: "#ee546c" }}>
                Meer info →
              </a>
            </div>
          </div>
        </div>
      </main>

      <footer style={{ backgroundColor: "#4a5f6d" }} className="text-white py-8 px-4 mt-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div>
              <p className="font-bold text-lg">Hasseltse Zwemvereniging Spartacus</p>
              <p className="text-white/70 text-sm mt-1">KHZS — Koninklijke Hasseltse Zwemvereniging Spartacus</p>
            </div>
            <nav className="flex flex-wrap gap-4 text-sm text-white/80">
              <Link href="/" className="hover:text-white">Home</Link>
              <Link href="/nieuws" className="hover:text-white">Nieuws</Link>
              <a href="https://khzs.be/trainingsuren-competitie/" target="_blank" rel="noopener" className="hover:text-white">Competitie</a>
              <a href="https://khzs.be/zwemschool-algemene-informatie/" target="_blank" rel="noopener" className="hover:text-white">Zwemschool</a>
              <a href="https://khzs.be/lidgeld/" target="_blank" rel="noopener" className="hover:text-white">Lidgeld</a>
            </nav>
          </div>
          <div className="border-t border-white/20 mt-6 pt-4 text-xs text-white/50">
            © {new Date().getFullYear()} Hasseltse Zwemvereniging Spartacus. Alle rechten voorbehouden.
          </div>
        </div>
      </footer>
    </>
  );
}

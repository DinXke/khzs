import { NextRequest } from "next/server";
import { getAllPosts, createPost } from "@/lib/db";

export async function GET() {
  try {
    const posts = getAllPosts();
    return Response.json(posts);
  } catch (error) {
    return Response.json({ error: "Database fout" }, { status: 500 });
  }
}

function generateSlug(titel: string): string {
  return titel
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    + "-" + Date.now();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { titel, inhoud, uitgelichte_afbeelding, publicatiedatum, gepubliceerd } = body;

    if (!titel || !inhoud) {
      return Response.json({ error: "Titel en inhoud zijn verplicht" }, { status: 400 });
    }

    const slug = generateSlug(titel);
    const post = createPost({
      titel,
      inhoud,
      uitgelichte_afbeelding: uitgelichte_afbeelding || null,
      publicatiedatum: publicatiedatum || new Date().toISOString().split("T")[0],
      slug,
      gepubliceerd: gepubliceerd !== undefined ? gepubliceerd : 1,
    });

    return Response.json(post, { status: 201 });
  } catch (error) {
    return Response.json({ error: "Fout bij aanmaken post" }, { status: 500 });
  }
}

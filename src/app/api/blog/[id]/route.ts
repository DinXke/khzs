import { NextRequest } from "next/server";
import { getPostById, updatePost, deletePost } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const post = getPostById(Number(id));
  if (!post) {
    return Response.json({ error: "Post niet gevonden" }, { status: 404 });
  }
  return Response.json(post);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const post = updatePost(Number(id), body);
    if (!post) {
      return Response.json({ error: "Post niet gevonden" }, { status: 404 });
    }
    return Response.json(post);
  } catch {
    return Response.json({ error: "Fout bij updaten post" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = deletePost(Number(id));
  if (!deleted) {
    return Response.json({ error: "Post niet gevonden" }, { status: 404 });
  }
  return Response.json({ success: true });
}

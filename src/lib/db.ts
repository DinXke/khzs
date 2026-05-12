import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, "blog.db");

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.exec(`
      CREATE TABLE IF NOT EXISTS blogposts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titel TEXT NOT NULL,
        inhoud TEXT NOT NULL,
        uitgelichte_afbeelding TEXT,
        publicatiedatum TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        gepubliceerd INTEGER NOT NULL DEFAULT 1,
        aangemaakt_op TEXT NOT NULL DEFAULT (datetime('now')),
        bijgewerkt_op TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
  }
  return db;
}

export type Blogpost = {
  id: number;
  titel: string;
  inhoud: string;
  uitgelichte_afbeelding: string | null;
  publicatiedatum: string;
  slug: string;
  gepubliceerd: number;
  aangemaakt_op: string;
  bijgewerkt_op: string;
};

export function getAllPosts(): Blogpost[] {
  return getDb()
    .prepare("SELECT * FROM blogposts ORDER BY publicatiedatum DESC")
    .all() as Blogpost[];
}

export function getPublishedPosts(): Blogpost[] {
  return getDb()
    .prepare(
      "SELECT * FROM blogposts WHERE gepubliceerd = 1 ORDER BY publicatiedatum DESC"
    )
    .all() as Blogpost[];
}

export function getPostById(id: number): Blogpost | null {
  return (
    (getDb()
      .prepare("SELECT * FROM blogposts WHERE id = ?")
      .get(id) as Blogpost) ?? null
  );
}

export function getPostBySlug(slug: string): Blogpost | null {
  return (
    (getDb()
      .prepare("SELECT * FROM blogposts WHERE slug = ? AND gepubliceerd = 1")
      .get(slug) as Blogpost) ?? null
  );
}

export function createPost(data: {
  titel: string;
  inhoud: string;
  uitgelichte_afbeelding?: string;
  publicatiedatum: string;
  slug: string;
  gepubliceerd?: number;
}): Blogpost {
  const stmt = getDb().prepare(`
    INSERT INTO blogposts (titel, inhoud, uitgelichte_afbeelding, publicatiedatum, slug, gepubliceerd)
    VALUES (@titel, @inhoud, @uitgelichte_afbeelding, @publicatiedatum, @slug, @gepubliceerd)
  `);
  const result = stmt.run({
    ...data,
    uitgelichte_afbeelding: data.uitgelichte_afbeelding ?? null,
    gepubliceerd: data.gepubliceerd ?? 1,
  });
  return getPostById(result.lastInsertRowid as number)!;
}

export function updatePost(
  id: number,
  data: {
    titel?: string;
    inhoud?: string;
    uitgelichte_afbeelding?: string | null;
    publicatiedatum?: string;
    slug?: string;
    gepubliceerd?: number;
  }
): Blogpost | null {
  const current = getPostById(id);
  if (!current) return null;
  const updated = { ...current, ...data, bijgewerkt_op: new Date().toISOString() };
  getDb()
    .prepare(`
      UPDATE blogposts
      SET titel = @titel, inhoud = @inhoud, uitgelichte_afbeelding = @uitgelichte_afbeelding,
          publicatiedatum = @publicatiedatum, slug = @slug, gepubliceerd = @gepubliceerd,
          bijgewerkt_op = @bijgewerkt_op
      WHERE id = @id
    `)
    .run(updated);
  return getPostById(id);
}

export function deletePost(id: number): boolean {
  const result = getDb()
    .prepare("DELETE FROM blogposts WHERE id = ?")
    .run(id);
  return result.changes > 0;
}

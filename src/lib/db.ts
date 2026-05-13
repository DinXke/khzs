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
    try {
      db = new Database(DB_PATH);
      db.pragma("journal_mode = WAL");
      db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'viewer',
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

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
        );

        CREATE TABLE IF NOT EXISTS sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          token TEXT UNIQUE NOT NULL,
          expires_at TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
    } catch (error) {
      console.error("Database initialization failed:", error);
      throw new Error("Database initialization failed. Check /data directory permissions and disk space.");
    }
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

export type User = {
  id: number;
  email: string;
  password_hash: string;
  role: 'admin' | 'editor' | 'viewer';
  created_at: string;
  updated_at: string;
};

export function getUserByEmail(email: string): User | null {
  return (
    (getDb()
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(email) as User) ?? null
  );
}

export function getUserById(id: number): User | null {
  return (
    (getDb()
      .prepare("SELECT * FROM users WHERE id = ?")
      .get(id) as User) ?? null
  );
}

export function createUser(email: string, passwordHash: string, role: 'admin' | 'editor' | 'viewer' = 'viewer'): User {
  const stmt = getDb().prepare(`
    INSERT INTO users (email, password_hash, role)
    VALUES (?, ?, ?)
  `);
  const result = stmt.run(email, passwordHash, role);
  return getUserById(result.lastInsertRowid as number)!;
}

export type Session = {
  id: number;
  user_id: number;
  token: string;
  expires_at: string;
  created_at: string;
};

export function createSession(userId: number, token: string, expiresAt: string): Session {
  const stmt = getDb().prepare(`
    INSERT INTO sessions (user_id, token, expires_at)
    VALUES (?, ?, ?)
  `);
  const result = stmt.run(userId, token, expiresAt);
  return getDb()
    .prepare("SELECT * FROM sessions WHERE id = ?")
    .get(result.lastInsertRowid) as Session;
}

export function getSessionByToken(token: string): (Session & { user: User }) | null {
  const session = getDb()
    .prepare(`
      SELECT s.*, u.id as user_id, u.email, u.password_hash, u.role, u.created_at as user_created_at, u.updated_at as user_updated_at
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ? AND s.expires_at > datetime('now')
    `)
    .get(token) as any;

  if (!session) return null;

  return {
    id: session.id,
    user_id: session.user_id,
    token: session.token,
    expires_at: session.expires_at,
    created_at: session.created_at,
    user: {
      id: session.user_id,
      email: session.email,
      password_hash: session.password_hash,
      role: session.role,
      created_at: session.user_created_at,
      updated_at: session.user_updated_at,
    },
  };
}

export function deleteSession(token: string): boolean {
  const result = getDb()
    .prepare("DELETE FROM sessions WHERE token = ?")
    .run(token);
  return result.changes > 0;
}

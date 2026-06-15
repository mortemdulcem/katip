import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  // The corpus_books / corpus_chunks tables are created and owned by the RAG
  // indexing script (scripts/research/index_corpus.cjs) using raw SQL with
  // pgvector/tsvector columns that are not modelled in the Drizzle schema.
  // Exclude them so `drizzle-kit push` never tries to drop them (they hold the
  // 24k-row research corpus + embeddings).
  tablesFilter: ["*", "!corpus_books", "!corpus_chunks"],
});

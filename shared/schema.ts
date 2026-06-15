import { pgTable, text, serial, integer, boolean, timestamp, varchar, primaryKey, real } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Import Auth User table
export { users } from "./models/auth";
import { users } from "./models/auth";
// Re-export the Replit Auth sessions table so drizzle-kit manages it (it is
// mandatory for auth and must never be dropped by a push).
export { sessions } from "./models/auth";

// === TABLE DEFINITIONS ===

export const papers = pgTable("papers", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id), // Owner
  title: text("title").notNull(),
  authors: text("authors").array().notNull(),
  abstract: text("abstract"),
  url: text("url"),
  venue: text("venue"),
  year: integer("year"),
  citationCount: integer("citation_count").default(0),
  isRead: boolean("is_read").default(false),
  isFavorite: boolean("is_favorite").default(false),
  addedAt: timestamp("added_at").defaultNow(),
});

export const collections = pgTable("collections", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Many-to-Many relation between Papers and Collections
export const collectionPapers = pgTable("collection_papers", {
  collectionId: integer("collection_id").notNull().references(() => collections.id, { onDelete: 'cascade' }),
  paperId: integer("paper_id").notNull().references(() => papers.id, { onDelete: 'cascade' }),
}, (t) => [
  primaryKey({ columns: [t.collectionId, t.paperId] })
]);

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  paperId: integer("paper_id").notNull().references(() => papers.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === RELATIONS ===

export const papersRelations = relations(papers, ({ one, many }) => ({
  user: one(users, {
    fields: [papers.userId],
    references: [users.id],
  }),
  notes: many(notes),
  collections: many(collectionPapers),
}));

export const collectionsRelations = relations(collections, ({ one, many }) => ({
  user: one(users, {
    fields: [collections.userId],
    references: [users.id],
  }),
  papers: many(collectionPapers),
}));

export const collectionPapersRelations = relations(collectionPapers, ({ one }) => ({
  collection: one(collections, {
    fields: [collectionPapers.collectionId],
    references: [collections.id],
  }),
  paper: one(papers, {
    fields: [collectionPapers.paperId],
    references: [papers.id],
  }),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  paper: one(papers, {
    fields: [notes.paperId],
    references: [papers.id],
  }),
  user: one(users, {
    fields: [notes.userId],
    references: [users.id],
  }),
}));

// === BASE SCHEMAS ===

export const insertPaperSchema = createInsertSchema(papers).omit({ 
  id: true, 
  userId: true, 
  addedAt: true 
}).extend({
  authors: z.array(z.string()).default([]), // Ensure array input
});

export const insertCollectionSchema = createInsertSchema(collections).omit({ 
  id: true, 
  userId: true, 
  createdAt: true 
});

export const insertNoteSchema = createInsertSchema(notes).omit({ 
  id: true, 
  userId: true, 
  paperId: true, // usually passed via param
  createdAt: true, 
  updatedAt: true 
});

// === EXPLICIT API CONTRACT TYPES ===

export type Paper = typeof papers.$inferSelect;
export type InsertPaper = z.infer<typeof insertPaperSchema>;

export type Collection = typeof collections.$inferSelect;
export type InsertCollection = z.infer<typeof insertCollectionSchema>;

export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;

// Request types
export type CreatePaperRequest = InsertPaper;
export type UpdatePaperRequest = Partial<InsertPaper>;

// Response types
export type PaperResponse = Paper & {
  // Optional relations usually fetched
  notes?: Note[];
  collections?: Collection[];
};

// === SIGNATURE RESEARCH TABLES ===

export const signatureParticipants = pgTable('signature_participants', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  age: integer('age'),
  gender: varchar('gender', { length: 1 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const signatureSamples = pgTable('signature_samples', {
  id: serial('id').primaryKey(),
  participantCode: varchar('participant_code', { length: 20 }).notNull(),
  shapeType: varchar('shape_type', { length: 20 }).notNull(),
  repetitionNumber: integer('repetition_number').notNull(),
  imageData: text('image_data').notNull(),
  pressureData: text('pressure_data'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const signatureComparisons = pgTable('signature_comparisons', {
  id: serial('id').primaryKey(),
  sample1Id: integer('sample1_id').notNull(),
  sample2Id: integer('sample2_id').notNull(),
  similarityScore: real('similarity_score'),
  aiVerdict: varchar('ai_verdict', { length: 20 }),
  aiReasoning: text('ai_reasoning'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const brainCtReports = pgTable('brain_ct_reports', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull(),
  patientTc: varchar('patient_tc', { length: 20 }).notNull(),
  patientName: text('patient_name').notNull(),
  birthDate: varchar('birth_date', { length: 10 }),
  gender: varchar('gender', { length: 1 }),
  studyDate: varchar('study_date', { length: 10 }),
  sampleCount: integer('sample_count'),
  findings: text('findings'),
  conclusion: text('conclusion'),
  technique: text('technique'),
  ctImageData: text('ct_image_data'),
  ctVideoData: text('ct_video_data'),
  reportText: text('report_text'),
  reportDate: text('report_date'),
  icdCode: varchar('icd_code', { length: 20 }),
  sutCode: varchar('sut_code', { length: 20 }),
  accessionNumber: varchar('accession_number', { length: 30 }),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const insertBrainCtReportSchema = createInsertSchema(brainCtReports).omit({ id: true, createdAt: true, updatedAt: true });
export type BrainCtReport = typeof brainCtReports.$inferSelect;
export type InsertBrainCtReport = z.infer<typeof insertBrainCtReportSchema>;

// === ORBITAL MORFOMETRİ (Tez) ===
// Anonim olgu kaydı: PII (TC/isim) tutulmaz, sadece kod + cinsiyet + yaş.
// landmarks/measurements/manualValues JSON metin olarak saklanır (tekrarlanabilir).
export const orbitalCases = pgTable('orbital_cases', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull(),
  code: varchar('code', { length: 30 }).notNull(),
  sex: varchar('sex', { length: 1 }), // E / K
  age: integer('age'),
  modelFileName: text('model_file_name'),
  landmarks: text('landmarks'),        // JSON: { right: {...}, left: {...}, rim/floor }
  measurements: text('measurements'),  // JSON: hesaplanan parametreler
  manualValues: text('manual_values'), // JSON: OV (hacim) gibi elle girilenler
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const insertOrbitalCaseSchema = createInsertSchema(orbitalCases).omit({
  id: true, userId: true, createdAt: true, updatedAt: true,
});
export type OrbitalCase = typeof orbitalCases.$inferSelect;
export type InsertOrbitalCase = z.infer<typeof insertOrbitalCaseSchema>;

export const insertSignatureParticipantSchema = createInsertSchema(signatureParticipants).omit({ id: true, createdAt: true });
export const insertSignatureSampleSchema = createInsertSchema(signatureSamples).omit({ id: true, createdAt: true });

export type SignatureParticipant = typeof signatureParticipants.$inferSelect;
export type InsertSignatureParticipant = z.infer<typeof insertSignatureParticipantSchema>;
export type SignatureSample = typeof signatureSamples.$inferSelect;
export type InsertSignatureSample = z.infer<typeof insertSignatureSampleSchema>;
export type SignatureComparison = typeof signatureComparisons.$inferSelect;

import { 
  papers, collections, notes, collectionPapers,
  signatureParticipants, signatureSamples, signatureComparisons,
  type Paper, type InsertPaper,
  type Collection, type InsertCollection,
  type Note, type InsertNote,
  type UpdatePaperRequest,
  type SignatureParticipant, type InsertSignatureParticipant,
  type SignatureSample, type InsertSignatureSample,
  type SignatureComparison
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // Papers
  getPapers(userId: string, filters?: { search?: string, collectionId?: number, isFavorite?: boolean }): Promise<Paper[]>;
  getPaper(id: number): Promise<Paper | undefined>;
  createPaper(paper: InsertPaper): Promise<Paper>;
  updatePaper(id: number, updates: UpdatePaperRequest): Promise<Paper>;
  deletePaper(id: number): Promise<void>;

  // Collections
  getCollections(userId: string): Promise<Collection[]>;
  createCollection(collection: InsertCollection): Promise<Collection>;
  deleteCollection(id: number): Promise<void>;
  addPaperToCollection(collectionId: number, paperId: number): Promise<void>;
  removePaperFromCollection(collectionId: number, paperId: number): Promise<void>;

  // Notes
  getNotes(paperId: number): Promise<Note[]>;
  createNote(note: InsertNote): Promise<Note>;
  deleteNote(id: number): Promise<void>;

  // Signature Research
  createSignatureParticipant(p: InsertSignatureParticipant): Promise<SignatureParticipant>;
  getSignatureParticipants(): Promise<SignatureParticipant[]>;
  getSignatureParticipant(code: string): Promise<SignatureParticipant | undefined>;
  saveSignatureSample(sample: InsertSignatureSample): Promise<SignatureSample>;
  getSignatureSamples(participantCode: string, shapeType?: string): Promise<SignatureSample[]>;
  getSignatureSampleById(id: number): Promise<SignatureSample | undefined>;
  deleteSignatureSample(id: number): Promise<void>;
  saveSignatureComparison(c: Omit<SignatureComparison, 'id' | 'createdAt'>): Promise<SignatureComparison>;
  getSignatureProgress(participantCode: string): Promise<Record<string, number>>;
}

export class DatabaseStorage implements IStorage {
  // Papers
  async getPapers(userId: string, filters?: { search?: string, collectionId?: number, isFavorite?: boolean }): Promise<Paper[]> {
    let query = db.select().from(papers).where(eq(papers.userId, userId)).orderBy(desc(papers.addedAt));

    if (filters?.isFavorite) {
      // Logic handled in route usually, but can be here. 
      // Drizzle query builder is easier to chain if we used it differently, 
      // but for now let's just filter in memory or minimal chaining if complex.
      // Re-instantiating query for specific filters:
    }
    
    // For simplicity with this setup, let's just fetch and filter or use dynamic where.
    const allPapers = await db.select().from(papers).where(eq(papers.userId, userId)).orderBy(desc(papers.addedAt));
    
    let result = allPapers;

    if (filters?.collectionId) {
       const relations = await db.select().from(collectionPapers).where(eq(collectionPapers.collectionId, filters.collectionId));
       const paperIds = new Set(relations.map(r => r.paperId));
       result = result.filter(p => paperIds.has(p.id));
    }

    if (filters?.isFavorite) {
      result = result.filter(p => p.isFavorite === true);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.abstract?.toLowerCase().includes(q) ||
        p.authors?.some(a => a.toLowerCase().includes(q))
      );
    }

    return result;
  }

  async getPaper(id: number): Promise<Paper | undefined> {
    const [paper] = await db.select().from(papers).where(eq(papers.id, id));
    return paper;
  }

  async createPaper(paper: InsertPaper): Promise<Paper> {
    const [newPaper] = await db.insert(papers).values(paper).returning();
    return newPaper;
  }

  async updatePaper(id: number, updates: UpdatePaperRequest): Promise<Paper> {
    const [updated] = await db.update(papers).set(updates).where(eq(papers.id, id)).returning();
    return updated;
  }

  async deletePaper(id: number): Promise<void> {
    await db.delete(papers).where(eq(papers.id, id));
  }

  // Collections
  async getCollections(userId: string): Promise<Collection[]> {
    return db.select().from(collections).where(eq(collections.userId, userId));
  }

  async createCollection(collection: InsertCollection): Promise<Collection> {
    const [newCollection] = await db.insert(collections).values(collection).returning();
    return newCollection;
  }

  async deleteCollection(id: number): Promise<void> {
    await db.delete(collections).where(eq(collections.id, id));
  }

  async addPaperToCollection(collectionId: number, paperId: number): Promise<void> {
    await db.insert(collectionPapers).values({ collectionId, paperId }).onConflictDoNothing();
  }

  async removePaperFromCollection(collectionId: number, paperId: number): Promise<void> {
    await db.delete(collectionPapers).where(
      and(eq(collectionPapers.collectionId, collectionId), eq(collectionPapers.paperId, paperId))
    );
  }

  // Notes
  async getNotes(paperId: number): Promise<Note[]> {
    return db.select().from(notes).where(eq(notes.paperId, paperId)).orderBy(desc(notes.createdAt));
  }

  async createNote(note: InsertNote): Promise<Note> {
    const [newNote] = await db.insert(notes).values(note).returning();
    return newNote;
  }

  async deleteNote(id: number): Promise<void> {
    await db.delete(notes).where(eq(notes.id, id));
  }

  // Signature Research
  async createSignatureParticipant(p: InsertSignatureParticipant): Promise<SignatureParticipant> {
    const [row] = await db.insert(signatureParticipants).values(p).returning();
    return row;
  }

  async getSignatureParticipants(): Promise<SignatureParticipant[]> {
    return db.select().from(signatureParticipants).orderBy(signatureParticipants.code);
  }

  async getSignatureParticipant(code: string): Promise<SignatureParticipant | undefined> {
    const [row] = await db.select().from(signatureParticipants).where(eq(signatureParticipants.code, code));
    return row;
  }

  async saveSignatureSample(sample: InsertSignatureSample): Promise<SignatureSample> {
    const [row] = await db.insert(signatureSamples).values(sample).returning();
    return row;
  }

  async getSignatureSamples(participantCode: string, shapeType?: string): Promise<SignatureSample[]> {
    if (shapeType) {
      return db.select().from(signatureSamples)
        .where(and(eq(signatureSamples.participantCode, participantCode), eq(signatureSamples.shapeType, shapeType)))
        .orderBy(signatureSamples.repetitionNumber);
    }
    return db.select().from(signatureSamples)
      .where(eq(signatureSamples.participantCode, participantCode))
      .orderBy(signatureSamples.shapeType, signatureSamples.repetitionNumber);
  }

  async getSignatureSampleById(id: number): Promise<SignatureSample | undefined> {
    const [row] = await db.select().from(signatureSamples).where(eq(signatureSamples.id, id));
    return row;
  }

  async deleteSignatureSample(id: number): Promise<void> {
    await db.delete(signatureSamples).where(eq(signatureSamples.id, id));
  }

  async saveSignatureComparison(c: Omit<SignatureComparison, 'id' | 'createdAt'>): Promise<SignatureComparison> {
    const [row] = await db.insert(signatureComparisons).values(c).returning();
    return row;
  }

  async getSignatureProgress(participantCode: string): Promise<Record<string, number>> {
    const samples = await db.select().from(signatureSamples)
      .where(eq(signatureSamples.participantCode, participantCode));
    const progress: Record<string, number> = {};
    for (const s of samples) {
      progress[s.shapeType] = (progress[s.shapeType] || 0) + 1;
    }
    return progress;
  }
}

export const storage = new DatabaseStorage();

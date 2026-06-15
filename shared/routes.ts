import { z } from 'zod';
import { insertPaperSchema, insertCollectionSchema, insertNoteSchema, papers, collections, notes } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  papers: {
    list: {
      method: 'GET' as const,
      path: '/api/papers' as const,
      input: z.object({
        search: z.string().optional(),
        collectionId: z.coerce.number().optional(),
        isFavorite: z.enum(['true', 'false']).optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof papers.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/papers/:id' as const,
      responses: {
        200: z.custom<typeof papers.$inferSelect>(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/papers' as const,
      input: insertPaperSchema,
      responses: {
        201: z.custom<typeof papers.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/papers/:id' as const,
      input: insertPaperSchema.partial(),
      responses: {
        200: z.custom<typeof papers.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/papers/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    analyze: {
      method: 'POST' as const,
      path: '/api/papers/:id/analyze' as const,
      responses: {
        200: z.object({ analysis: z.string() }),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
        500: errorSchemas.internal,
      },
    },
  },
  collections: {
    list: {
      method: 'GET' as const,
      path: '/api/collections' as const,
      responses: {
        200: z.array(z.custom<typeof collections.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/collections' as const,
      input: insertCollectionSchema,
      responses: {
        201: z.custom<typeof collections.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/collections/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    addPaper: {
      method: 'POST' as const,
      path: '/api/collections/:id/papers/:paperId' as const,
      responses: {
        200: z.object({ message: z.string() }),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    removePaper: {
      method: 'DELETE' as const,
      path: '/api/collections/:id/papers/:paperId' as const,
      responses: {
        200: z.object({ message: z.string() }),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
  },
  literatureSearch: {
    search: {
      method: 'POST' as const,
      path: '/api/literature-search' as const,
      input: z.object({
        query: z.string().min(1),
      }),
      responses: {
        200: z.object({
          results: z.array(z.object({
            title: z.string(),
            authors: z.array(z.string()),
            year: z.number().optional(),
            venue: z.string().optional(),
            abstract: z.string(),
            similarity: z.number(),
            url: z.string().optional(),
            relevanceReason: z.string(),
          })),
        }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        500: errorSchemas.internal,
      },
    },
  },
  thesisAnalysis: {
    analyze: {
      method: 'POST' as const,
      path: '/api/thesis-analysis' as const,
      input: z.object({
        text: z.string().min(10),
        title: z.string().optional(),
      }),
      responses: {
        200: z.object({
          originalityScore: z.number(),
          originalityLevel: z.string(),
          originalitySummary: z.string(),
          strengths: z.array(z.string()),
          weaknesses: z.array(z.string()),
          suggestions: z.array(z.object({
            title: z.string(),
            description: z.string(),
            impact: z.enum(["high", "medium", "low"]),
          })),
          similarPapers: z.array(z.object({
            title: z.string(),
            authors: z.array(z.string()),
            year: z.number().optional(),
            venue: z.string().optional(),
            similarity: z.number(),
            url: z.string().optional(),
            relevanceReason: z.string(),
          })),
        }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        500: errorSchemas.internal,
      },
    },
  },
  notes: {
    list: {
      method: 'GET' as const,
      path: '/api/papers/:paperId/notes' as const,
      responses: {
        200: z.array(z.custom<typeof notes.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/papers/:paperId/notes' as const,
      input: insertNoteSchema,
      responses: {
        201: z.custom<typeof notes.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/notes/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

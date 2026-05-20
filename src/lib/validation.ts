import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().min(1).max(50),
  icon: z.string().max(200).nullish(),
  order: z.number().int().default(0),
});

export const linkSchema = z.object({
  categoryId: z.number().int().positive(),
  title: z.string().min(1).max(100),
  url: z.string().url().max(500),
  description: z.string().max(300).nullish(),
  iconUrl: z.string().max(500).nullish(),
  order: z.number().int().default(0),
});

export const searchEngineSchema = z.object({
  name: z.string().min(1).max(50),
  urlTemplate: z.string().min(1).max(500).refine((s) => s.includes('{q}'), {
    message: 'urlTemplate must contain {q}',
  }),
  icon: z.string().max(200).nullish(),
  isDefault: z.boolean().default(false),
  order: z.number().int().default(0),
});

export const reorderSchema = z.array(z.object({ id: z.number().int(), order: z.number().int() }));

export const settingsSchema = z.object({
  siteTitle: z.string().max(100).optional(),
  siteSubtitle: z.string().max(200).optional(),
});

export const linkSubmissionSchema = z.object({
  title: z.string().min(1).max(100),
  url: z.string().url().max(500),
  description: z.string().max(300).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});

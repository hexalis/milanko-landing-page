import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
const directions = z.tuple([z.string(), z.string(), z.string()]);
const pages = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/pages' }),
  schema: z.object({
    title: z.string().min(1), description: z.string().min(1),
    hero: z.object({ text: z.string(), action: z.string() }),
    chapters: z.array(z.object({ id: z.string().regex(/^[a-z-]+$/), title: z.string(), text: z.string(), detail: z.string().optional() })).length(2),
    investigation: z.object({
      subject: z.string(),
      topic: z.tuple([z.string(), z.string()]),
      filter: z.string(),
      directions: directions,
      questions: z.tuple([directions, directions]),
      regions: z.object({ atlantic: z.string(), sahara: z.string(), pacific: z.string(), canada: z.string(), australia: z.string() }),


      readTable: z.string(),
      hints: directions,
      instructions: z.string(),
      region: z.string(),
      reading: z.string(),
      baseline: z.string(),
      inspectRegion: z.string(),
      compare: z.string(),
      miss: z.string(),
      match: z.string(),
      finish: z.string(),
      result: z.string(),
      settings: z.string(),
      again: z.string(),
      fallback: z.string(),
      staticTitle: z.string(),
      staticAnswer: z.string(),
      next: z.string(),
      cause: z.string(),
      preview: z.string(),
      sample: z.string(),
      measure: z.tuple([z.string(), z.string()]),
      revise: z.string(),
      period: z.string(),
      periodValue: z.string(),
      source: z.string(),
      sourceValue: z.string(),
      lens: z.string(),
      above: z.string(),
      below: z.string(),
      between: z.string(),
    }),
    faq: z.array(z.object({ question: z.string(), answer: z.string() })).min(1),
  }),
});
export const collections = { pages };

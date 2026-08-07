import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const insights = defineCollection({
  loader: glob({
    pattern: '**/index.{de,en}.md',
    base: './src/content/insights',
    generateId: ({ entry }) => entry.replace(/\/index\.(de|en)\.md$/, '/$1'),
  }),
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    cover: image().optional(),
    coverAlt: z.string().optional(),
  }),
});

export const collections = { insights };

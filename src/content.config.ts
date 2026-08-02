import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const schema = z.object({
  title: z.string(),
  description: z.string(),
  pubDate: z.coerce.date(),
});

const insights = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/insights' }),
  schema,
});

const insightsEn = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/insights-en' }),
  schema,
});

export const collections = { insights, insightsEn };

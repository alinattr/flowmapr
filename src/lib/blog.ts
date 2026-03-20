import { readFile } from 'node:fs/promises'
import path from 'node:path'

export type BlogPostMeta = {
  slug: string
  title: string
  description: string
  publishedAt: string
  readTime: string
}

const POSTS: BlogPostMeta[] = [
  {
    slug: 'best-ai-diagram-tools-for-business-analysts',
    title: 'Best AI Diagram Tools for Business Analysts in 2026',
    description:
      'A practical, balanced comparison of top AI diagram tools for analysts, including BPMN, UML sequence diagrams, collaboration, and pricing trade-offs.',
    publishedAt: '2026-03-20',
    readTime: '9 min read',
  },
]

export function getAllPosts(): BlogPostMeta[] {
  return POSTS
}

export function getPostBySlug(slug: string): BlogPostMeta | null {
  return POSTS.find((p) => p.slug === slug) ?? null
}

export async function getPostMdx(slug: string): Promise<string> {
  const filePath = path.join(
    process.cwd(),
    'content',
    'blog',
    `${slug}.mdx`
  )
  return readFile(filePath, 'utf8')
}

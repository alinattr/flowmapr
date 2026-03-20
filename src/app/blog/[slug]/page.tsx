import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import type {
  AnchorHTMLAttributes,
  HTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from 'react'
import { evaluate } from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'
import { getAllPosts, getPostBySlug, getPostMdx } from '@/lib/blog'

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return { title: 'Blog | Flowmapr' }

  const seoDescription =
    'Compare the best AI diagram tools for business analysts in 2026. Honest review of Flowmapr, Eraser, Lucidchart, draw.io and Mermaid with BPMN and UML support comparison.'

  return {
    title: post.title,
    description: seoDescription,
    openGraph: {
      title: post.title,
      description: seoDescription,
      type: 'article',
      url: `https://flowmapr.com/blog/${post.slug}`,
    },
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

const ComparisonTable = () => (
  <div style={{ overflowX: 'auto', margin: '32px 0' }}>
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 1.5fr',
        minWidth: '700px',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px',
        overflow: 'hidden',
        fontSize: '13px',
      }}
    >
      {['Tool', 'AI capability', 'BPMN', 'UML Sequence', 'For analysts', 'Key drawback'].map((h) => (
        <div
          key={h}
          style={{
            background: 'rgba(99,102,241,0.2)',
            padding: '12px 14px',
            color: '#a5b4fc',
            fontWeight: 600,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {h}
        </div>
      ))}
      {[
        ['Flowmapr', 'High', 'Strong', 'Strong', 'High', 'Less freeform whiteboarding'],
        ['Eraser', 'High', 'Moderate', 'Moderate', 'Medium', 'Less BPMN-focused'],
        ['Mermaid', 'Medium', 'Limited', 'Good', 'Low–Medium', 'Text syntax barrier'],
        ['Lucidchart', 'Medium', 'Good', 'Good', 'High', 'Costly, still manual'],
        ['draw.io', 'Low', 'Good', 'Good', 'Medium', 'Heavy manual effort'],
      ].map((row, i) =>
        row.map((cell, j) => (
          <div
            key={`${i}-${j}`}
            style={{
              padding: '11px 14px',
              background: i % 2 === 0 ? '#111113' : '#0f0f11',
              color: j === 0 ? '#f8fafc' : '#a1a1aa',
              borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              fontWeight: j === 0 ? 600 : 400,
            }}
          >
            {cell}
          </div>
        ))
      )}
    </div>
  </div>
)

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const source = await getPostMdx(slug)
  const { default: Content } = await evaluate(source, {
    ...runtime,
    format: 'mdx',
  })

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#09090B',
        color: '#E4E4E7',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <article style={{ maxWidth: 860, margin: '0 auto', padding: '88px 24px 72px' }}>
        <div style={{ marginBottom: 20 }}>
          <Link
            href="/blog"
            style={{
              color: '#A5B4FC',
              fontSize: 13,
              textDecoration: 'none',
            }}
          >
            ← Back to Blog
          </Link>
        </div>

        <h1
          style={{
            fontSize: 'clamp(34px, 5vw, 52px)',
            lineHeight: 1.08,
            marginBottom: 14,
            color: '#F8FAFC',
          }}
        >
          {post.title}
        </h1>

        <div
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            marginBottom: 34,
            color: '#94A3B8',
            fontSize: 13,
          }}
        >
          <span>{formatDate(post.publishedAt)}</span>
          <span>•</span>
          <span>{post.readTime}</span>
        </div>

        <div
          style={{
            maxWidth: 720,
            color: '#D4D4D8',
            fontSize: 17,
            lineHeight: 1.8,
          }}
        >
          <Content
            components={{
              ComparisonTable,
              h2: (props: HTMLAttributes<HTMLHeadingElement>) => (
                <h2
                  {...props}
                  style={{
                    marginTop: 54,
                    marginBottom: 16,
                    fontSize: 31,
                    lineHeight: 1.2,
                    color: '#F8FAFC',
                  }}
                />
              ),
              h3: (props: HTMLAttributes<HTMLHeadingElement>) => (
                <h3
                  {...props}
                  style={{
                    marginTop: 26,
                    marginBottom: 10,
                    fontSize: 24,
                    lineHeight: 1.28,
                    color: '#F1F5F9',
                  }}
                />
              ),
              p: (props: HTMLAttributes<HTMLParagraphElement>) => (
                <p {...props} style={{ marginBottom: 16 }} />
              ),
              ul: (props: HTMLAttributes<HTMLUListElement>) => (
                <ul {...props} style={{ marginBottom: 16, paddingLeft: 20 }} />
              ),
              ol: (props: HTMLAttributes<HTMLOListElement>) => (
                <ol {...props} style={{ marginBottom: 16, paddingLeft: 20 }} />
              ),
              li: (props: HTMLAttributes<HTMLLIElement>) => (
                <li {...props} style={{ marginBottom: 6 }} />
              ),
              a: (props: AnchorHTMLAttributes<HTMLAnchorElement>) => (
                <a
                  {...props}
                  style={{ color: '#A5B4FC', textDecoration: 'underline' }}
                />
              ),
              table: (props: TableHTMLAttributes<HTMLTableElement>) => (
                <div
                  style={{
                    overflowX: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    marginBottom: 20,
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 10,
                    background: '#1a1a1f',
                  }}
                >
                  <table
                    {...props}
                    style={{
                      width: '100%',
                      minWidth: 760,
                      borderCollapse: 'collapse',
                      fontSize: 14,
                    }}
                  />
                </div>
              ),
              th: (props: ThHTMLAttributes<HTMLTableCellElement>) => (
                <th
                  {...props}
                  style={{
                    border: '1px solid rgba(255,255,255,0.08)',
                    padding: '12px',
                    textAlign: 'left',
                    color: '#F8FAFC',
                    background: 'rgba(99,102,241,0.28)',
                    fontWeight: 700,
                  }}
                />
              ),
              td: (props: TdHTMLAttributes<HTMLTableCellElement>) => (
                <td
                  {...props}
                  style={{
                    border: '1px solid rgba(255,255,255,0.08)',
                    padding: '12px',
                    verticalAlign: 'top',
                    background: '#1a1a1f',
                  }}
                />
              ),
            }}
          />
        </div>

        <section
          style={{
            marginTop: 36,
            padding: '20px 20px',
            borderRadius: 12,
            border: '1px solid rgba(99,102,241,0.35)',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.14), rgba(139,92,246,0.12))',
          }}
        >
          <p
            style={{
              margin: 0,
              color: '#E2E8F0',
              fontSize: 16,
              lineHeight: 1.6,
              fontWeight: 600,
            }}
          >
            Generate your first diagram in seconds →{' '}
            <Link
              href="https://flowmapr.com/signup"
              style={{ color: '#C4B5FD', textDecoration: 'underline' }}
            >
              Try Flowmapr free
            </Link>
          </p>
        </section>
      </article>
    </main>
  )
}

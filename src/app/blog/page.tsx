import Link from 'next/link'
import { getAllPosts } from '@/lib/blog'

export const metadata = {
  title: 'Flowmapr Blog',
  description:
    'Guides and comparisons for AI diagram generation, BPMN, UML sequence diagrams, and business analyst workflow optimization.',
}

export default function BlogIndexPage() {
  const posts = getAllPosts()

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#09090B',
        color: '#E4E4E7',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '96px 24px 64px' }}>
        <Link
          href="/"
          className="mb-[18px] inline-block text-[13px] text-[#94A3B8] no-underline transition-colors duration-150 hover:text-[#E2E8F0]"
        >
          ← Back to Flowmapr
        </Link>
        <h1
          style={{
            fontSize: 'clamp(34px, 5vw, 52px)',
            lineHeight: 1.1,
            marginBottom: 12,
            color: '#F8FAFC',
          }}
        >
          Flowmapr Blog
        </h1>
        <p
          style={{
            fontSize: 18,
            color: '#94A3B8',
            maxWidth: 760,
            lineHeight: 1.6,
            marginBottom: 34,
          }}
        >
          Deep dives on AI diagram generator workflows, BPMN diagram tool selection,
          UML sequence diagram best practices, and practical business analyst diagram software guidance.
        </p>

        <div style={{ display: 'grid', gap: 16 }}>
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              style={{
                textDecoration: 'none',
                color: 'inherit',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 14,
                padding: '22px 22px 20px',
                transition: 'all 0.18s ease',
                display: 'block',
              }}
            >
              <div style={{ display: 'flex', gap: 10, fontSize: 12.5, color: '#94A3B8', marginBottom: 10 }}>
                <span>{new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                <span>•</span>
                <span>{post.readTime}</span>
              </div>
              <h2 style={{ fontSize: 27, lineHeight: 1.2, margin: '0 0 10px', color: '#F8FAFC' }}>
                {post.title}
              </h2>
              <p style={{ margin: 0, color: '#A1A1AA', fontSize: 15.5, lineHeight: 1.6 }}>
                {post.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}

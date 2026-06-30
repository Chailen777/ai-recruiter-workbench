import Link from 'next/link'

export default function NotFound() {
  return (
    <div
      style={{
        alignItems: 'center',
        background: '#fafafa',
        color: '#333',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontSize: '4rem', fontWeight: 700, margin: '0 0 0.5rem' }}>404</h1>
      <p style={{ color: '#666', marginBottom: '2rem', maxWidth: '480px' }}>
        你访问的页面不存在，可能已被移动或删除。
      </p>
      <Link
        href="/home"
        style={{
          background: '#0070f3',
          borderRadius: '8px',
          color: '#fff',
          display: 'inline-block',
          fontSize: '0.9rem',
          padding: '0.75rem 1.5rem',
          textDecoration: 'none',
        }}
      >
        回到首页
      </Link>
    </div>
  )
}

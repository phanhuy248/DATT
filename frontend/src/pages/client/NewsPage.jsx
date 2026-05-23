import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPosts } from '../../api/posts'

export default function NewsPage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { getPosts().then(setPosts).finally(() => setLoading(false)) }, [])
  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 40 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Tin tức SmartShop</h1>
      {loading ? <div className="spinner" /> : posts.length === 0 ? <div className="empty-state"><p>Chưa có tin tức</p></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {posts.map(p => <Link key={p.id} to={`/news/${p.slug}`} className="card" style={{ textDecoration: 'none', color: 'inherit', overflow: 'hidden' }}>
            {p.thumbnail && <img src={p.thumbnail} alt="" style={{ width: '100%', height: 150, objectFit: 'cover' }} />}
            <div className="card-body"><h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{p.title}</h2><p style={{ fontSize: 13, color: '#6b7280' }}>{p.summary}</p></div>
          </Link>)}
        </div>
      )}
    </div>
  )
}

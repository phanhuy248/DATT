import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getPost } from '../../api/posts'

export default function PostDetailPage() {
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { getPost(slug).then(setPost).finally(() => setLoading(false)) }, [slug])
  if (loading) return <div className="spinner" />
  if (!post) return <div className="container empty-state"><p>Không tìm thấy tin tức</p></div>
  return (
    <article className="container" style={{ maxWidth: 860, paddingTop: 32, paddingBottom: 48 }}>
      <h1 style={{ fontSize: 30, fontWeight: 800, marginBottom: 12 }}>{post.title}</h1>
      {post.summary && <p style={{ color: '#64748b', fontSize: 16, marginBottom: 20 }}>{post.summary}</p>}
      {post.thumbnail && <img src={post.thumbnail} alt="" style={{ width: '100%', maxHeight: 360, objectFit: 'cover', borderRadius: 8, marginBottom: 24 }} />}
      <div style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{post.content}</div>
    </article>
  )
}

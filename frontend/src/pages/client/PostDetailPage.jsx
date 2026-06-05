import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getPost } from '../../api/posts'

export default function PostDetailPage() {
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPost(slug).then(setPost).finally(() => setLoading(false))
  }, [slug])

  if (loading) return <div className="spinner" />

  if (!post) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-5 lg:px-6">
        <div className="empty-state rounded-2xl border border-shop-border bg-shop-surface shadow-sm">
          <p>Không tìm thấy tin tức</p>
        </div>
      </div>
    )
  }

  return (
    <article className="mx-auto max-w-4xl px-4 py-10 sm:px-5 lg:px-6">
      <h1 className="text-3xl font-bold leading-tight text-shop-text">{post.title}</h1>
      {post.summary && <p className="mt-3 text-base font-medium leading-7 text-shop-muted">{post.summary}</p>}
      {post.thumbnail && <img src={post.thumbnail} alt="" className="mt-6 max-h-[380px] w-full rounded-2xl object-cover shadow-sm" />}
      <div className="mt-6 whitespace-pre-wrap rounded-2xl border border-shop-border bg-shop-surface p-5 text-sm font-medium leading-7 text-shop-text shadow-sm lg:p-6">
        {post.content}
      </div>
    </article>
  )
}

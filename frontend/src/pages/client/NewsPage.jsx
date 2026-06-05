import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPosts } from '../../api/posts'
import SectionHeader from '../../components/ui/SectionHeader'

export default function NewsPage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPosts().then(setPosts).finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-5 lg:px-6">
      <SectionHeader title="Tin tức SMARTSHOP" subtitle="Cập nhật hướng dẫn mua sắm, chính sách và sản phẩm công nghệ" />
      {loading ? (
        <div className="spinner" />
      ) : posts.length === 0 ? (
        <div className="empty-state rounded-2xl border border-shop-border bg-shop-surface shadow-sm">
          <p>Chưa có tin tức</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link key={post.id} to={`/news/${post.slug}`} className="overflow-hidden rounded-2xl border border-shop-border bg-shop-surface shadow-sm transition hover:border-shop-red hover:shadow-md">
              {post.thumbnail && <img src={post.thumbnail} alt="" className="h-44 w-full object-cover" />}
              <div className="p-5">
                <h2 className="line-clamp-2 text-base font-bold leading-6 text-shop-text">{post.title}</h2>
                <p className="mt-2 line-clamp-3 text-sm font-medium leading-6 text-shop-muted">{post.summary}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

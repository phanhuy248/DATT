import { useEffect, useState } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight, Zap } from 'lucide-react'
import { getActiveBanners } from '../../api/banners'
import { getImageUrl } from '../../utils/image'
import Button from '../ui/Button'
import heroLaptop from '../../assets/home/hero-laptop-dark.svg'
import heroPhone from '../../assets/home/hero-phone-dark.svg'
import heroTablet from '../../assets/home/hero-tablet-dark.svg'

const AUTOPLAY_DELAY = 4500

const slides = [
  {
    id: 'laptop',
    eyebrow: 'Laptop cao cấp',
    name: 'Laptop cao cấp',
    title: 'Trải nghiệm',
    highlight: 'đỉnh cao.',
    description: 'Camera 200MP, sạc siêu nhanh 100W - Ưu đãi độc quyền chỉ có tại SMARTSHOP trong hôm nay.',
    image: heroLaptop,
    href: '/products?categoryName=Laptop',
    ctaLabel: 'Mua ngay',
  },
  {
    id: 'phone',
    eyebrow: 'Điện thoại cao cấp',
    name: 'Điện thoại cao cấp',
    title: 'Trải nghiệm',
    highlight: 'đỉnh cao.',
    description: 'Camera 200MP, sạc siêu nhanh 100W - Ưu đãi độc quyền chỉ có tại SMARTSHOP trong hôm nay.',
    image: heroPhone,
    href: '/products?categoryName=%C4%90i%E1%BB%87n%20tho%E1%BA%A1i',
    ctaLabel: 'Mua ngay',
  },
  {
    id: 'tablet',
    eyebrow: 'Tablet cao cấp',
    name: 'Tablet cao cấp',
    title: 'Trải nghiệm',
    highlight: 'đỉnh cao.',
    description: 'Camera 200MP, sạc siêu nhanh 100W - Ưu đãi độc quyền chỉ có tại SMARTSHOP trong hôm nay.',
    image: heroTablet,
    href: '/products?categoryName=M%C3%A1y%20t%C3%ADnh%20b%E1%BA%A3ng',
    ctaLabel: 'Mua ngay',
  },
]

function getPosition(index, activeIndex, total) {
  const diff = (index - activeIndex + total) % total

  if (diff === 0) return 'center'
  if (diff === 1) return 'right'
  return 'left'
}

function normalizeBanner(banner) {
  return {
    id: `banner-${banner.id}`,
    eyebrow: 'Ưu đãi nổi bật',
    name: banner.title,
    title: banner.title,
    highlight: '',
    description: banner.subtitle || 'Khám phá chương trình mới đang hiển thị tại SMARTSHOP.',
    image: getImageUrl(banner.image),
    href: banner.linkUrl || '/products',
    ctaLabel: 'Xem ngay',
    isBanner: true,
  }
}

export default function HeroSection() {
  const [bannerSlides, setBannerSlides] = useState([])
  const [activeIndex, setActiveIndex] = useState(1)
  const displaySlides = bannerSlides.length > 0 ? bannerSlides : slides
  const activeSlide = displaySlides[activeIndex] || displaySlides[0]

  useEffect(() => {
    let mounted = true

    getActiveBanners()
      .then((items) => {
        if (!mounted) return
        const activeBanners = Array.isArray(items)
          ? items.filter((item) => item?.image).map(normalizeBanner)
          : []
        setBannerSlides(activeBanners)
        if (activeBanners.length > 0) setActiveIndex(0)
      })
      .catch(() => {
        if (mounted) setBannerSlides([])
      })

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (displaySlides.length <= 1) return undefined

    const timer = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % displaySlides.length)
    }, AUTOPLAY_DELAY)

    return () => window.clearInterval(timer)
  }, [displaySlides.length])

  function goToSlide(index) {
    setActiveIndex(index)
  }

  function goPrev() {
    setActiveIndex((currentIndex) => (currentIndex - 1 + displaySlides.length) % displaySlides.length)
  }

  function goNext() {
    setActiveIndex((currentIndex) => (currentIndex + 1) % displaySlides.length)
  }

  return (
    <section className={`home-hero-banner ${activeSlide.isBanner ? 'has-admin-banner' : ''}`}>
      <div className="home-hero-copy">
        <div className="home-hero-badge">
          <Zap size={16} />
          {activeSlide.eyebrow}
        </div>

        <h1>
          {activeSlide.title}
          {activeSlide.highlight && <span>{activeSlide.highlight}</span>}
        </h1>

        <p>{activeSlide.description}</p>

        <div className="home-hero-actions">
          <Button to={activeSlide.href} size="lg" className="home-hero-primary-btn">
            {activeSlide.ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button to="/products?sortBy=newest" size="lg" variant="secondary" className="home-hero-secondary-btn">
            Tìm hiểu thêm
          </Button>
        </div>
      </div>

      <div className="home-hero-slider" aria-label="Sản phẩm nổi bật">
        {displaySlides.length > 1 && (
          <button type="button" className="home-hero-arrow home-hero-arrow-left" onClick={goPrev} aria-label="Ảnh trước">
            <ChevronLeft size={30} />
          </button>
        )}

        <div className="home-hero-stage">
          {displaySlides.map((slide, index) => {
            const position = getPosition(index, activeIndex, displaySlides.length)

            return (
              <button
                key={slide.id}
                type="button"
                className={`home-hero-product ${slide.isBanner ? 'is-banner-slide' : ''} is-${position}`}
                onClick={() => goToSlide(index)}
                aria-label={`Hiển thị ${slide.name}`}
              >
                <img src={slide.image} alt={slide.name} />
              </button>
            )
          })}
        </div>

        {displaySlides.length > 1 && (
          <button type="button" className="home-hero-arrow home-hero-arrow-right" onClick={goNext} aria-label="Ảnh tiếp theo">
            <ChevronRight size={30} />
          </button>
        )}

        {displaySlides.length > 1 && (
          <div className="home-hero-dots" aria-label="Chọn slide">
            {displaySlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                className={activeIndex === index ? 'is-active' : ''}
                onClick={() => goToSlide(index)}
                aria-label={`Chọn ${slide.name}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

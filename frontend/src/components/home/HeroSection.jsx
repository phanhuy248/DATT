import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight, Zap } from 'lucide-react'
import Button from '../ui/Button'
import heroLaptop from '../../assets/home/hero-laptop-dark.svg'
import heroPhone from '../../assets/home/hero-phone-dark.svg'
import heroTablet from '../../assets/home/hero-tablet-dark.svg'

const AUTOPLAY_DELAY = 4500

const slides = [
  {
    id: 'laptop',
    name: 'Laptop cao cấp',
    image: heroLaptop,
    href: '/products?keyword=Laptop',
  },
  {
    id: 'phone',
    name: 'Điện thoại cao cấp',
    image: heroPhone,
    href: '/products?keyword=%C4%90i%E1%BB%87n%20tho%E1%BA%A1i',
  },
  {
    id: 'tablet',
    name: 'Tablet cao cấp',
    image: heroTablet,
    href: '/products?keyword=Tablet',
  },
]

function getPosition(index, activeIndex) {
  const total = slides.length
  const diff = (index - activeIndex + total) % total

  if (diff === 0) return 'center'
  if (diff === 1) return 'right'
  return 'left'
}

export default function HeroSection() {
  const [activeIndex, setActiveIndex] = useState(1)
  const directionRef = useRef(1)
  const activeSlide = slides[activeIndex]

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((currentIndex) => {
        let nextIndex = currentIndex + directionRef.current

        if (nextIndex >= slides.length) {
          directionRef.current = -1
          nextIndex = currentIndex - 1
        }

        if (nextIndex < 0) {
          directionRef.current = 1
          nextIndex = currentIndex + 1
        }

        return nextIndex
      })
    }, AUTOPLAY_DELAY)

    return () => window.clearInterval(timer)
  }, [])

  function goToSlide(index) {
    directionRef.current = index >= activeIndex ? 1 : -1
    setActiveIndex(index)
  }

  function goPrev() {
    directionRef.current = -1
    setActiveIndex((currentIndex) => (currentIndex - 1 + slides.length) % slides.length)
  }

  function goNext() {
    directionRef.current = 1
    setActiveIndex((currentIndex) => (currentIndex + 1) % slides.length)
  }

  return (
    <section className="home-hero-banner">
      <div className="home-hero-copy">
        <div className="home-hero-badge">
          <Zap size={16} />
          Điện thoại cao cấp
        </div>

        <h1>
          Trải nghiệm
          <span>đỉnh cao.</span>
        </h1>

        <p>Camera 200MP, sạc siêu nhanh 100W - Ưu đãi độc quyền chỉ có tại SMARTSHOP trong hôm nay.</p>

        <div className="home-hero-actions">
          <Button to={activeSlide.href} size="lg" className="home-hero-primary-btn">
            Mua ngay
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button to="/products?sortBy=newest" size="lg" variant="secondary" className="home-hero-secondary-btn">
            Tìm hiểu thêm
          </Button>
        </div>
      </div>

      <div className="home-hero-slider" aria-label="Sản phẩm nổi bật">
        <button type="button" className="home-hero-arrow home-hero-arrow-left" onClick={goPrev} aria-label="Ảnh trước">
          <ChevronLeft size={30} />
        </button>

        <div className="home-hero-stage">
          {slides.map((slide, index) => {
            const position = getPosition(index, activeIndex)

            return (
              <button
                key={slide.id}
                type="button"
                className={`home-hero-product is-${position}`}
                onClick={() => goToSlide(index)}
                aria-label={`Hiển thị ${slide.name}`}
              >
                <img src={slide.image} alt={slide.name} />
              </button>
            )
          })}
        </div>

        <button type="button" className="home-hero-arrow home-hero-arrow-right" onClick={goNext} aria-label="Ảnh tiếp theo">
          <ChevronRight size={30} />
        </button>

        <div className="home-hero-dots" aria-label="Chọn slide">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              className={activeIndex === index ? 'is-active' : ''}
              onClick={() => goToSlide(index)}
              aria-label={`Chọn ${slide.name}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

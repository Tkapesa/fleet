import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Cinematic landing motion: hero entrance + scroll reveals.
 * Respects prefers-reduced-motion.
 */
export function useLandingMotion(rootRef) {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      root.querySelectorAll('[data-hero-anim], [data-animate]').forEach((el) => {
        el.style.opacity = '1'
        el.style.transform = 'none'
      })
      return undefined
    }

    const ctx = gsap.context(() => {
      const heroItems = root.querySelectorAll('[data-hero-anim]')
      if (heroItems.length) {
        gsap.set(heroItems, { opacity: 0, y: 42 })
        gsap.to(heroItems, {
          opacity: 1,
          y: 0,
          duration: 1,
          stagger: 0.12,
          ease: 'power3.out',
          delay: 0.15,
        })
      }

      root.querySelectorAll('[data-animate]').forEach((el) => {
        const type = el.getAttribute('data-animate') || 'up'
        const from = {
          opacity: 0,
          y: type === 'up' ? 52 : 0,
          x: type === 'left' ? -40 : type === 'right' ? 40 : 0,
          scale: type === 'scale' ? 0.94 : 1,
        }

        gsap.from(el, {
          ...from,
          duration: 0.95,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            toggleActions: 'play none none none',
          },
        })
      })
    }, root)

    return () => ctx.revert()
  }, [rootRef])
}

import { useEffect } from 'react'

export function useFramerAppear() {
  useEffect(() => {
    const els = document.querySelectorAll('[data-framer-appear-id]')
    if (!els.length) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (!e.isIntersecting) return
          e.target.classList.add('appeared')
          io.unobserve(e.target)
          // Cascade to child appear-id elements so nested animations
          // (e.g. heading inside a section wrapper) also fire.
          const children = e.target.querySelectorAll('[data-framer-appear-id]')
          children.forEach((child, i) => {
            setTimeout(() => child.classList.add('appeared'), (i + 1) * 80)
          })
        })
      },
      { threshold: 0.01, rootMargin: '200px 0px 200px 0px' }
    )
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])
}

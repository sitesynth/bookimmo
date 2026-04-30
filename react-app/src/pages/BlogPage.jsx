import React from 'react'
import { useTranslation } from 'react-i18next'
import Hero from '../components/Hero.jsx'
import HeroTexts from '../components/HeroTexts.jsx'
import HeroText from '../components/HeroText.jsx'
import HeroTextImage from '../components/HeroTextImage.jsx'
import FindThePerfect from '../components/FindThePerfect.jsx'

export default function BlogPage() {
  const { t } = useTranslation()

  return (
    <main>
      <Hero />
      <HeroTexts />
      <HeroText />
      <HeroTextImage />
      <FindThePerfect />
    </main>
  )
}

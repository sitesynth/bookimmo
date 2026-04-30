import React from 'react'
import { useTranslation } from 'react-i18next'
import Hero from '../components/Hero.jsx'
import HeroTexts from '../components/HeroTexts.jsx'
import HeroText from '../components/HeroText.jsx'
import HeroTextImage from '../components/HeroTextImage.jsx'
import FindThePerfect from '../components/FindThePerfect.jsx'
import House from '../components/House.jsx'
import HouseIllustration from '../components/HouseIllustration.jsx'
import SecondLine from '../components/SecondLine.jsx'
import PropertyWithBookImmo from '../components/PropertyWithBookImmo.jsx'
import WeBelieveThereSAPerfectHomeForEverybodyNoMatterTheBudgetThatSWhyWeAlwaysFindTheBestHomesForYourBudget from '../components/WeBelieveThereSAPerfectHomeForEverybodyNoMatterTheBudgetThatSWhyWeAlwaysFindTheBestHomesForYourBudget.jsx'

export default function HomePage() {
  const { t } = useTranslation()

  return (
    <main>
      <Hero />
      <HeroTexts />
      <HeroText />
      <HeroTextImage />
      <FindThePerfect />
      <House />
      <HouseIllustration />
      <SecondLine />
      <PropertyWithBookImmo />
      <WeBelieveThereSAPerfectHomeForEverybodyNoMatterTheBudgetThatSWhyWeAlwaysFindTheBestHomesForYourBudget />
    </main>
  )
}

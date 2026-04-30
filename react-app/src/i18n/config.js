import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import de from './de.json'
import en from './en.json'
import fr from './fr.json'
import it from './it.json'
import nl from './nl.json'

i18n.use(initReactI18next).init({
  resources: {
  de: { translation: de },
  en: { translation: en },
  fr: { translation: fr },
  it: { translation: it },
  nl: { translation: nl }
  },
  lng: 'de',
  fallbackLng: 'de',
  interpolation: { escapeValue: false }
})

export default i18n

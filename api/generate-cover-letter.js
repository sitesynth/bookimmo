import { spawnSync } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'

const LANGUAGE_LABELS = {
  de: 'German',
  en: 'English',
  fr: 'French',
  it: 'Italian',
  nl: 'Dutch',
}

function normalizeLanguage(code) {
  return LANGUAGE_LABELS[code] ? code : 'en'
}

function fallbackLetter({ language, property, profile, application }) {
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() || 'I'
  const city = profile.currentCity || 'Hamburg'
  const moveIn = profile.moveInDate || 'the requested move-in date'
  const occupation = profile.occupation || 'a working professional'
  const income = profile.monthlyNetIncome ? `with a monthly household net income of EUR ${profile.monthlyNetIncome}` : 'with stable household income'
  const docs = profile.documents?.length ? 'I can provide the relevant application documents, including supporting proofs, with this application.' : 'I am currently preparing my application documents.'
  const propertyName = property?.title || 'this property'
  const household = `${profile.adultsCount || '1'} adult(s)` + (profile.childrenCount && profile.childrenCount !== '0' ? ` and ${profile.childrenCount} child(ren)` : '')
  const pets = profile.pets === 'yes' ? 'We have pets.' : 'We do not have pets.'
  const applicationStatus = application?.status ? `This application is currently in ${application.status} status.` : ''

  const templates = {
    de: `Guten Tag,\n\nmein Name ist ${name}. Ich interessiere mich sehr fuer ${propertyName}. Wir suchen eine langfristige Mietwohnung in ${city} und koennten ab ${moveIn} einziehen.\n\nWir sind ${household}. Ich bin ${occupation} ${income}. ${pets} ${docs} ${applicationStatus} Ich wuerde mich sehr freuen, wenn Sie meine Bewerbung beruecksichtigen.\n\nMit freundlichen Gruessen\n${name}`,
    en: `Hello,\n\nmy name is ${name} and I am very interested in ${propertyName}. We are looking for a long-term rental in ${city} and would be ready to move in from ${moveIn}.\n\nWe are ${household}. I am ${occupation} ${income}. ${pets} ${docs} ${applicationStatus} I would be very happy if you considered my application.\n\nKind regards,\n${name}`,
    fr: `Bonjour,\n\nje m'appelle ${name} et je suis tres interesse(e) par ${propertyName}. Nous recherchons une location de longue duree a ${city} et pourrions emmenager a partir de ${moveIn}.\n\nNous sommes ${household}. Je suis ${occupation} ${income}. ${pets} ${docs} ${applicationStatus} Je serais ravi(e) si vous pouviez prendre ma candidature en consideration.\n\nCordialement,\n${name}`,
    it: `Buongiorno,\n\nmi chiamo ${name} e sono molto interessato(a) a ${propertyName}. Cerchiamo una locazione a lungo termine a ${city} e potremmo trasferirci da ${moveIn}.\n\nSiamo ${household}. Sono ${occupation} ${income}. ${pets} ${docs} ${applicationStatus} Sarei felice se prendeste in considerazione la mia candidatura.\n\nCordiali saluti,\n${name}`,
    nl: `Hallo,\n\nmijn naam is ${name} en ik ben erg geinteresseerd in ${propertyName}. Wij zoeken een huurwoning voor langere tijd in ${city} en kunnen verhuizen vanaf ${moveIn}.\n\nWij zijn ${household}. Ik ben ${occupation} ${income}. ${pets} ${docs} ${applicationStatus} Ik zou het zeer waarderen als u mijn aanvraag wilt overwegen.\n\nMet vriendelijke groet,\n${name}`,
  }

  return templates[language] || templates.en
}

function buildPrompt({ language, property, profile, application }) {
  const languageLabel = LANGUAGE_LABELS[language]
  return [
    `Write a concise rental application cover letter in ${languageLabel}.`,
    'The tone should be warm, trustworthy, and realistic for a housing application in Germany.',
    'Use the already completed profile and document context as the basis for the final message.',
    'Do not use placeholders. Use the provided profile and property details directly.',
    'Keep it to 140-220 words.',
    'Do not invent facts that are not supported by the data.',
    'Avoid bullet points and avoid markdown.',
    '',
    `Property title: ${property.title || 'Unknown property'}`,
    `Property address: ${property.address || property.city_slug || 'Unknown address'}`,
    `Property category: ${property.property_category || 'Unknown'}`,
    `Property price: ${property.price || ''}`,
    `Move-in date: ${profile.moveInDate || 'Unknown'}`,
    `Applicant first name: ${profile.firstName || ''}`,
    `Applicant last name: ${profile.lastName || ''}`,
    `Current city: ${profile.currentCity || ''}`,
    `Current address: ${profile.currentAddress || ''}`,
    `Occupation: ${profile.occupation || ''}`,
    `Employment status: ${profile.employmentStatus || ''}`,
    `Monthly household net income: ${profile.monthlyNetIncome || ''}`,
    `Adults: ${profile.adultsCount || ''}`,
    `Children: ${profile.childrenCount || ''}`,
    `Pets: ${profile.pets || ''}`,
    `Shared apartment: ${profile.sharedApartment || ''}`,
    `About household: ${profile.aboutMe || ''}`,
    `Preferred districts: ${profile.preferredDistricts || ''}`,
    `Existing cover letter base: ${profile.coverLetterTemplate || ''}`,
    `Available documents: ${(profile.documents || []).map((item) => item.category || item.name).join(', ')}`,
    `Document count: ${(profile.documents || []).length}`,
    `Application status: ${application.status || 'draft'}`,
    `Existing application letter draft: ${application.coverMessage || ''}`,
  ].join('\n')
}

function runGeminiPrompt(prompt) {
  const home = os.homedir()
  const script = `
import os, sys
sys.path.insert(0, os.path.expanduser("~/membria-ce"))
from membria.kb_ingest import gemini_generate
prompt = sys.stdin.read()
out = gemini_generate(
    prompt,
    model="gemini-2.5-flash",
    temperature=0.4,
    credentials_path=os.path.expanduser("~/membria-gemini-key.json"),
)
print(out or "")
`.trim()

  return spawnSync('python3', ['-c', script], {
    input: prompt,
    encoding: 'utf8',
    env: {
      ...process.env,
      PYTHONPATH: [path.join(home, 'membria-ce'), process.env.PYTHONPATH || ''].filter(Boolean).join(':'),
      GOOGLE_APPLICATION_CREDENTIALS: path.join(home, 'membria-gemini-key.json'),
    },
    timeout: 120000,
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const language = normalizeLanguage(req.body?.language)
  const property = req.body?.property || {}
  const profile = req.body?.profile || {}
  const application = req.body?.application || {}
  const prompt = buildPrompt({ language, property, profile, application })

  try {
    const result = runGeminiPrompt(prompt)

    if (result.status !== 0) {
      return res.status(200).json({
        text: fallbackLetter({ language, property, profile, application }),
        fallback: true,
        detail: result.stderr || `python exit ${result.status}`,
      })
    }

    const text = String(result.stdout || '').trim()

    if (!text) {
      return res.status(200).json({
        text: fallbackLetter({ language, property, profile, application }),
        fallback: true,
      })
    }

    return res.status(200).json({ text, fallback: false, provider: 'gemini' })
  } catch (error) {
    return res.status(200).json({
      text: fallbackLetter({ language, property, profile, application }),
      fallback: true,
      detail: String(error),
    })
  }
}

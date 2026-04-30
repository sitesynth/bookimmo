import React, { useEffect } from 'react'
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import HomePage from './pages/HomePage.jsx'
import BlogPage from './pages/BlogPage.jsx'

function LangWrapper({ lang }) {
  const { i18n } = useTranslation()
  useEffect(() => { i18n.changeLanguage(lang) }, [lang, i18n])
  return null
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/de" replace />} />

      <Route path="/de" element={<LangWrapper lang="de" />}>
        <Route index element={<HomePage />} />
        <Route path="blog" element={<BlogPage />} />
      </Route>
      <Route path="/en" element={<LangWrapper lang="en" />}>
        <Route index element={<HomePage />} />
        <Route path="blog" element={<BlogPage />} />
      </Route>
      <Route path="/fr" element={<LangWrapper lang="fr" />}>
        <Route index element={<HomePage />} />
        <Route path="blog" element={<BlogPage />} />
      </Route>
      <Route path="/it" element={<LangWrapper lang="it" />}>
        <Route index element={<HomePage />} />
        <Route path="blog" element={<BlogPage />} />
      </Route>
      <Route path="/nl" element={<LangWrapper lang="nl" />}>
        <Route index element={<HomePage />} />
        <Route path="blog" element={<BlogPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/de" replace />} />
    </Routes>
  )
}

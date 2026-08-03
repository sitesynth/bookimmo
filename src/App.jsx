import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate, Outlet, useNavigate, useParams } from 'react-router-dom'
import { detectPreferredLanguage } from './lib/language.js'

function RedirectWithSlug({ base }) {
  const { slug } = useParams()
  return <Navigate to={`/en/${base}/${slug}`} replace />
}
import { useTranslation } from 'react-i18next'
import HomePage from './pages/HomePage.jsx'
import DashboardHomePage from './pages/DashboardHomePage.jsx'
import SearchPage from './pages/SearchPage.jsx'
import ApplicationsPage from './pages/ApplicationsPage.jsx'
import AgentPage from './pages/AgentPage.jsx'
import AgentLogInPage from './pages/AgentLogInPage.jsx'
import AgentWorkspacePage from './pages/AgentWorkspacePage.jsx'
import SignUpPage from './pages/SignUpPage.jsx'
import LogInPage from './pages/LogInPage.jsx'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage.jsx'
import TermsOfServicePage from './pages/TermsOfServicePage.jsx'
import BookmarkPage from './pages/BookmarkPage.jsx'
import AccountPage from './pages/AccountPage.jsx'
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx'
import UpdatePasswordPage from './pages/UpdatePasswordPage.jsx'
import AuthCallbackPage from './pages/AuthCallbackPage.jsx'
import NotFoundPage from './pages/_404Page.jsx'
import PropertyDetailPage from './pages/PropertyDetailPage.jsx'
import AgentDetailPage from './pages/AgentDetailPage.jsx'

function GeoLanguageRedirect({ path = '' }) {
  const navigate = useNavigate()
  const [resolved, setResolved] = useState(false)

  useEffect(() => {
    let active = true

    detectPreferredLanguage()
      .then((lang) => {
        if (!active) return
        navigate(`/${lang}${path}`, { replace: true })
      })
      .finally(() => {
        if (active) setResolved(true)
      })

    return () => {
      active = false
    }
  }, [navigate, path])

  return resolved ? null : null
}

function LangWrapper({ lang }) {
  const { i18n } = useTranslation()
  useEffect(() => { i18n.changeLanguage(lang) }, [lang, i18n])
  return <Outlet />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<GeoLanguageRedirect />} />
      <Route path="/dashboard-home" element={<GeoLanguageRedirect path="/dashboard-home" />} />
      <Route path="/search" element={<GeoLanguageRedirect path="/search" />} />
      <Route path="/applications" element={<GeoLanguageRedirect path="/applications" />} />
      <Route path="/agent" element={<GeoLanguageRedirect path="/agent" />} />
      <Route path="/agent-workspace" element={<GeoLanguageRedirect path="/agent-workspace" />} />
      <Route path="/sign-up" element={<GeoLanguageRedirect path="/sign-up" />} />
      <Route path="/log-in" element={<GeoLanguageRedirect path="/log-in" />} />
      <Route path="/agent-log-in" element={<GeoLanguageRedirect path="/agent-log-in" />} />
      <Route path="/privacy-policy" element={<GeoLanguageRedirect path="/privacy-policy" />} />
      <Route path="/terms-of-service" element={<GeoLanguageRedirect path="/terms-of-service" />} />
      <Route path="/Bookmark" element={<GeoLanguageRedirect path="/Bookmark" />} />
      <Route path="/account" element={<GeoLanguageRedirect path="/account" />} />
      <Route path="/forgot-password" element={<GeoLanguageRedirect path="/forgot-password" />} />
      <Route path="/update-password" element={<GeoLanguageRedirect path="/update-password" />} />
      <Route path="/Property-Details/:slug" element={<RedirectWithSlug base="Property-Details" />} />
      <Route path="/agent-details/:slug" element={<RedirectWithSlug base="agent-details" />} />
      <Route path="/agents-details/:slug" element={<RedirectWithSlug base="agents-details" />} />
      <Route path="/de" element={<LangWrapper lang="de" />}>
        <Route index element={<HomePage />} />
        <Route path="dashboard-home" element={<DashboardHomePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="applications" element={<ApplicationsPage />} />
        <Route path="agent" element={<AgentPage />} />
        <Route path="agent-workspace" element={<AgentWorkspacePage />} />
        <Route path="sign-up" element={<SignUpPage />} />
        <Route path="log-in" element={<LogInPage />} />
        <Route path="agent-log-in" element={<AgentLogInPage />} />
        <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="terms-of-service" element={<TermsOfServicePage />} />
        <Route path="Bookmark" element={<BookmarkPage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="update-password" element={<UpdatePasswordPage />} />
        <Route path="auth/callback" element={<AuthCallbackPage />} />
        <Route path="Property-Details/:slug" element={<PropertyDetailPage />} />
        <Route path="agent-details/:slug" element={<AgentDetailPage />} />
        <Route path="agents-details/:slug" element={<AgentDetailPage />} />
      </Route>
      <Route path="/en" element={<LangWrapper lang="en" />}>
        <Route index element={<HomePage />} />
        <Route path="dashboard-home" element={<DashboardHomePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="applications" element={<ApplicationsPage />} />
        <Route path="agent" element={<AgentPage />} />
        <Route path="agent-workspace" element={<AgentWorkspacePage />} />
        <Route path="sign-up" element={<SignUpPage />} />
        <Route path="log-in" element={<LogInPage />} />
        <Route path="agent-log-in" element={<AgentLogInPage />} />
        <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="terms-of-service" element={<TermsOfServicePage />} />
        <Route path="Bookmark" element={<BookmarkPage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="update-password" element={<UpdatePasswordPage />} />
        <Route path="auth/callback" element={<AuthCallbackPage />} />
        <Route path="Property-Details/:slug" element={<PropertyDetailPage />} />
        <Route path="agent-details/:slug" element={<AgentDetailPage />} />
        <Route path="agents-details/:slug" element={<AgentDetailPage />} />
      </Route>
      <Route path="/fr" element={<LangWrapper lang="fr" />}>
        <Route index element={<HomePage />} />
        <Route path="dashboard-home" element={<DashboardHomePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="applications" element={<ApplicationsPage />} />
        <Route path="agent" element={<AgentPage />} />
        <Route path="agent-workspace" element={<AgentWorkspacePage />} />
        <Route path="sign-up" element={<SignUpPage />} />
        <Route path="log-in" element={<LogInPage />} />
        <Route path="agent-log-in" element={<AgentLogInPage />} />
        <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="terms-of-service" element={<TermsOfServicePage />} />
        <Route path="Bookmark" element={<BookmarkPage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="update-password" element={<UpdatePasswordPage />} />
        <Route path="auth/callback" element={<AuthCallbackPage />} />
        <Route path="Property-Details/:slug" element={<PropertyDetailPage />} />
        <Route path="agent-details/:slug" element={<AgentDetailPage />} />
        <Route path="agents-details/:slug" element={<AgentDetailPage />} />
      </Route>
      <Route path="/it" element={<LangWrapper lang="it" />}>
        <Route index element={<HomePage />} />
        <Route path="dashboard-home" element={<DashboardHomePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="applications" element={<ApplicationsPage />} />
        <Route path="agent" element={<AgentPage />} />
        <Route path="agent-workspace" element={<AgentWorkspacePage />} />
        <Route path="sign-up" element={<SignUpPage />} />
        <Route path="log-in" element={<LogInPage />} />
        <Route path="agent-log-in" element={<AgentLogInPage />} />
        <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="terms-of-service" element={<TermsOfServicePage />} />
        <Route path="Bookmark" element={<BookmarkPage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="update-password" element={<UpdatePasswordPage />} />
        <Route path="auth/callback" element={<AuthCallbackPage />} />
        <Route path="Property-Details/:slug" element={<PropertyDetailPage />} />
        <Route path="agent-details/:slug" element={<AgentDetailPage />} />
        <Route path="agents-details/:slug" element={<AgentDetailPage />} />
      </Route>
      <Route path="/nl" element={<LangWrapper lang="nl" />}>
        <Route index element={<HomePage />} />
        <Route path="dashboard-home" element={<DashboardHomePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="applications" element={<ApplicationsPage />} />
        <Route path="agent" element={<AgentPage />} />
        <Route path="agent-workspace" element={<AgentWorkspacePage />} />
        <Route path="sign-up" element={<SignUpPage />} />
        <Route path="log-in" element={<LogInPage />} />
        <Route path="agent-log-in" element={<AgentLogInPage />} />
        <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="terms-of-service" element={<TermsOfServicePage />} />
        <Route path="Bookmark" element={<BookmarkPage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="update-password" element={<UpdatePasswordPage />} />
        <Route path="auth/callback" element={<AuthCallbackPage />} />
        <Route path="Property-Details/:slug" element={<PropertyDetailPage />} />
        <Route path="agent-details/:slug" element={<AgentDetailPage />} />
        <Route path="agents-details/:slug" element={<AgentDetailPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/en" replace />} />
    </Routes>
  )
}

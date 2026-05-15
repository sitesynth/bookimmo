import React, { useEffect } from 'react'
import { Routes, Route, Navigate, Outlet, useNavigate, useParams } from 'react-router-dom'

function RedirectWithSlug({ base }) {
  const { slug } = useParams()
  return <Navigate to={`/de/${base}/${slug}`} replace />
}
import { useTranslation } from 'react-i18next'
import HomePage from './pages/HomePage.jsx'
import DashboardHomePage from './pages/DashboardHomePage.jsx'
import SearchPage from './pages/SearchPage.jsx'
import AgentPage from './pages/AgentPage.jsx'
import SignUpPage from './pages/SignUpPage.jsx'
import LogInPage from './pages/LogInPage.jsx'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage.jsx'
import TermsOfServicePage from './pages/TermsOfServicePage.jsx'
import BookmarkPage from './pages/BookmarkPage.jsx'
import AccountPage from './pages/AccountPage.jsx'
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx'
import UpdatePasswordPage from './pages/UpdatePasswordPage.jsx'
import NotFoundPage from './pages/_404Page.jsx'
import PropertyDetailPage from './pages/PropertyDetailPage.jsx'
import AgentDetailPage from './pages/AgentDetailPage.jsx'

const LANGS = ['de', 'en', 'fr', 'it', 'nl']

function LangWrapper({ lang }) {
  const { i18n } = useTranslation()
  useEffect(() => { i18n.changeLanguage(lang) }, [lang, i18n])
  return <Outlet />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/de" replace />} />
      <Route path="/dashboard-home" element={<Navigate to="/de/dashboard-home" replace />} />
      <Route path="/search" element={<Navigate to="/de/search" replace />} />
      <Route path="/agent" element={<Navigate to="/de/agent" replace />} />
      <Route path="/sign-up" element={<Navigate to="/de/sign-up" replace />} />
      <Route path="/log-in" element={<Navigate to="/de/log-in" replace />} />
      <Route path="/privacy-policy" element={<Navigate to="/de/privacy-policy" replace />} />
      <Route path="/terms-of-service" element={<Navigate to="/de/terms-of-service" replace />} />
      <Route path="/Bookmark" element={<Navigate to="/de/Bookmark" replace />} />
      <Route path="/account" element={<Navigate to="/de/account" replace />} />
      <Route path="/forgot-password" element={<Navigate to="/de/forgot-password" replace />} />
      <Route path="/update-password" element={<Navigate to="/de/update-password" replace />} />
      <Route path="/Property-Details/:slug" element={<RedirectWithSlug base="Property-Details" />} />
      <Route path="/agent-details/:slug" element={<RedirectWithSlug base="agent-details" />} />
      <Route path="/agents-details/:slug" element={<RedirectWithSlug base="agents-details" />} />
      <Route path="/de" element={<LangWrapper lang="de" />}>
        <Route index element={<HomePage />} />
        <Route path="dashboard-home" element={<DashboardHomePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="agent" element={<AgentPage />} />
        <Route path="sign-up" element={<SignUpPage />} />
        <Route path="log-in" element={<LogInPage />} />
        <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="terms-of-service" element={<TermsOfServicePage />} />
        <Route path="Bookmark" element={<BookmarkPage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="update-password" element={<UpdatePasswordPage />} />
        <Route path="Property-Details/:slug" element={<PropertyDetailPage />} />
        <Route path="agent-details/:slug" element={<AgentDetailPage />} />
        <Route path="agents-details/:slug" element={<AgentDetailPage />} />
      </Route>
      <Route path="/en" element={<LangWrapper lang="en" />}>
        <Route index element={<HomePage />} />
        <Route path="dashboard-home" element={<DashboardHomePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="agent" element={<AgentPage />} />
        <Route path="sign-up" element={<SignUpPage />} />
        <Route path="log-in" element={<LogInPage />} />
        <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="terms-of-service" element={<TermsOfServicePage />} />
        <Route path="Bookmark" element={<BookmarkPage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="update-password" element={<UpdatePasswordPage />} />
        <Route path="Property-Details/:slug" element={<PropertyDetailPage />} />
        <Route path="agent-details/:slug" element={<AgentDetailPage />} />
        <Route path="agents-details/:slug" element={<AgentDetailPage />} />
      </Route>
      <Route path="/fr" element={<LangWrapper lang="fr" />}>
        <Route index element={<HomePage />} />
        <Route path="dashboard-home" element={<DashboardHomePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="agent" element={<AgentPage />} />
        <Route path="sign-up" element={<SignUpPage />} />
        <Route path="log-in" element={<LogInPage />} />
        <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="terms-of-service" element={<TermsOfServicePage />} />
        <Route path="Bookmark" element={<BookmarkPage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="update-password" element={<UpdatePasswordPage />} />
        <Route path="Property-Details/:slug" element={<PropertyDetailPage />} />
        <Route path="agent-details/:slug" element={<AgentDetailPage />} />
        <Route path="agents-details/:slug" element={<AgentDetailPage />} />
      </Route>
      <Route path="/it" element={<LangWrapper lang="it" />}>
        <Route index element={<HomePage />} />
        <Route path="dashboard-home" element={<DashboardHomePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="agent" element={<AgentPage />} />
        <Route path="sign-up" element={<SignUpPage />} />
        <Route path="log-in" element={<LogInPage />} />
        <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="terms-of-service" element={<TermsOfServicePage />} />
        <Route path="Bookmark" element={<BookmarkPage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="update-password" element={<UpdatePasswordPage />} />
        <Route path="Property-Details/:slug" element={<PropertyDetailPage />} />
        <Route path="agent-details/:slug" element={<AgentDetailPage />} />
        <Route path="agents-details/:slug" element={<AgentDetailPage />} />
      </Route>
      <Route path="/nl" element={<LangWrapper lang="nl" />}>
        <Route index element={<HomePage />} />
        <Route path="dashboard-home" element={<DashboardHomePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="agent" element={<AgentPage />} />
        <Route path="sign-up" element={<SignUpPage />} />
        <Route path="log-in" element={<LogInPage />} />
        <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="terms-of-service" element={<TermsOfServicePage />} />
        <Route path="Bookmark" element={<BookmarkPage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="update-password" element={<UpdatePasswordPage />} />
        <Route path="Property-Details/:slug" element={<PropertyDetailPage />} />
        <Route path="agent-details/:slug" element={<AgentDetailPage />} />
        <Route path="agents-details/:slug" element={<AgentDetailPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/de" replace />} />
    </Routes>
  )
}

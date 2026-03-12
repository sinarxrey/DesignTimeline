import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import './index.css'

const App = lazy(() => import('./App.jsx'))
const Landing = lazy(() => import('./pages/Landing.jsx'))

const VISITED_APP_KEY = 'designtimeline-visited-app'

function AppRoute() {
  useEffect(() => {
    try {
      localStorage.setItem(VISITED_APP_KEY, '1')
    } catch {}
  }, [])
  return <App />
}

function PageTransition({ children }) {
  return <div className="page-transition">{children}</div>
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <Suspense fallback={<div className="page-transition" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <PageTransition>
            <Landing />
          </PageTransition>
        } />
        <Route path="/app" element={
          <PageTransition>
            <AppRoute />
          </PageTransition>
        } />
      </Routes>
    </Suspense>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  </StrictMode>,
)

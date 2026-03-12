import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BarChart3, Layers, Save, FileText } from 'lucide-react'
import './Landing.css'

const VISITED_APP_KEY = 'designtimeline-visited-app'

const FEATURES = [
  {
    icon: BarChart3,
    title: 'Break down pages and estimate by role',
    description: 'Add pages or screens and estimate design effort per role (senior, middle, or junior).',
  },
  {
    icon: Layers,
    title: 'Adjust complexity per page',
    description: 'Mark each page as normal, quite complex, or more complex to refine your timeline.',
  },
  {
    icon: Save,
    title: 'Auto-save and export',
    description: 'Data is stored locally with no login required. Export your project as JSON backup.',
  },
  {
    icon: FileText,
    title: 'Print-ready timelines',
    description: 'Generate timelines ready to share with stakeholders and clients.',
  },
]

export default function Landing() {
  const navigate = useNavigate()

  useEffect(() => {
    try {
      if (localStorage.getItem(VISITED_APP_KEY)) {
        navigate('/app', { replace: true })
      }
    } catch {}
  }, [navigate])

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="landing">
      <header className="landing-header">
        <Link to="/" className="landing-logo">
          <img src="/LogoDesignTimeline.png" alt="Design Timeline" width={160} height={32} loading="eager" />
        </Link>
        <nav className="landing-nav">
          <button type="button" className="landing-nav-link" onClick={scrollToFeatures}>
            Features
          </button>
          <a href="https://github.com/sinarxrey/DesignTimeline" target="_blank" rel="noopener noreferrer" className="landing-nav-link">
            GitHub
          </a>
          <Link to="/app" className="landing-cta landing-nav-cta">
            Calculate Timeline
          </Link>
        </nav>
      </header>

      <main className="landing-main">
        <section className="landing-hero">
          <h1 className="landing-hero-title">Lightning what matters</h1>
          <p className="landing-hero-subtitle">
            Estimate design timelines by page and complexity — no signup, no manual spreadsheets.
          </p>
          <Link to="/app" className="landing-cta landing-hero-cta">
            Calculate Timeline
          </Link>
          <p className="landing-hero-secondary">No signup · Free to use</p>
          <div className="landing-hero-screenshot">
            <picture>
              <source srcSet="/HeroBanner.webp" type="image/webp" />
              <img
                src="/HeroBanner.png"
                alt="Design Timeline"
                width={1200}
                height={900}
                fetchPriority="high"
                loading="eager"
              />
            </picture>
          </div>
        </section>

        <div id="features" className="landing-bottom">
          <section className="landing-features">
            <h2 className="landing-features-title">How it works</h2>
            <div className="landing-features-grid">
              {FEATURES.map((f, i) => {
                const Icon = f.icon
                return (
                <div key={i} className="landing-feature">
                  <div className="landing-feature-icon">
                    <Icon size={24} aria-hidden />
                  </div>
                  <h3 className="landing-feature-title">{f.title}</h3>
                  <p className="landing-feature-desc">{f.description}</p>
                </div>
                )
              })}
            </div>
          </section>
          <footer className="landing-footer">
            <a href="https://github.com/sinarxrey/DesignTimeline" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <a href="https://sinarxrey.com" target="_blank" rel="noopener noreferrer">
              Portfolio
            </a>
          </footer>
        </div>
      </main>
    </div>
  )
}

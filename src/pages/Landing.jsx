import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import 'iconify-icon'
import '../App.css'

const VISITED_APP_KEY = 'designtimeline-visited-app'

const FEATURES = [
  {
    icon: 'ri:bar-chart-box-line',
    title: 'Break down pages and estimate by role',
    description: 'Add pages or screens and estimate design effort per role (senior, middle, or junior).',
  },
  {
    icon: 'ri:stack-line',
    title: 'Adjust complexity per page',
    description: 'Mark each page as normal, quite complex, or more complex to refine your timeline.',
  },
  {
    icon: 'ri:save-line',
    title: 'Auto-save and export',
    description: 'Data is stored locally with no login required. Export your project as JSON backup.',
  },
  {
    icon: 'ri:file-text-line',
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
          <img src="/LogoDesignTimeline.png" alt="Design Timeline" />
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
            <img src="/HeroBanner.png" alt="Design Timeline" />
          </div>
        </section>

        <div id="features" className="landing-bottom">
          <section className="landing-features">
            <h2 className="landing-features-title">How it works</h2>
            <div className="landing-features-grid">
              {FEATURES.map((f, i) => (
                <div key={i} className="landing-feature">
                  <div className="landing-feature-icon">
                    <iconify-icon icon={f.icon} width="24" height="24"></iconify-icon>
                  </div>
                  <h3 className="landing-feature-title">{f.title}</h3>
                  <p className="landing-feature-desc">{f.description}</p>
                </div>
              ))}
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

      <style>{`
        .landing {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #ffffff;
          color: var(--text-primary);
        }

        .landing-header {
          position: sticky;
          top: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 8vw;
          background: rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: none;
        }

        .landing-logo img {
          height: 32px;
          width: auto;
          display: block;
        }

        .landing-nav {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .landing-nav-link {
          background: transparent !important;
          border: none;
          font-family: inherit;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 0;
          box-shadow: none;
          transform: none;
          text-decoration: none;
        }

        .landing-nav-link:hover {
          color: var(--accent);
          background: transparent !important;
          box-shadow: none;
          transform: none;
        }

        .landing-cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          border-radius: var(--radius-md);
          border: 1px solid var(--text-primary);
          color: var(--text-primary);
          background: transparent;
          transition: all 0.2s ease;
        }

        .landing-cta:hover {
          background: var(--text-primary);
          color: var(--bg-primary);
        }

        .landing-nav-cta {
          border: none;
          background: transparent !important;
          color: var(--text-primary);
          font-weight: 700;
          padding: 0;
          box-shadow: none;
        }

        .landing-nav-cta:hover {
          border: none;
          background: transparent !important;
          color: var(--accent);
          box-shadow: none;
        }

        .landing-main {
          flex: 0 0 auto;
        }

        .landing-hero {
          padding: 64px 8vw 32px;
          text-align: center;
          max-width: 1200px;
          margin: 0 auto;
          background: transparent;
          border: none;
          border-radius: 0;
        }

        .landing-hero-title {
          margin: 0 0 16px;
          font-family: 'Hedvig Letters Serif', serif;
          font-size: 48px;
          font-weight: 600;
          letter-spacing: -0.5px;
          line-height: 1.2;
        }

        .landing-hero-subtitle {
          margin: 0 0 32px;
          font-size: 18px;
          font-weight: 400;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .landing-hero-cta {
          margin-bottom: 12px;
          border-radius: 100px;
        }

        .landing-hero-secondary {
          margin: 0 0 48px;
          font-size: 14px;
          color: var(--text-tertiary);
        }

        .landing-hero-screenshot {
          width: 100%;
          overflow: hidden;
          border-radius: var(--radius-lg);
        }

        .landing-hero-screenshot img {
          width: 100%;
          height: auto;
          display: block;
        }

        .landing-bottom {
          background: #ffffff;
          border-top: none;
        }

        .landing-features {
          padding: 16px 8vw 16px;
          background: transparent;
          border: none;
          border-radius: 0;
          margin: 0 auto;
          max-width: 1200px;
        }

        .landing-features-title {
          margin: 0 0 40px;
          font-size: 24px;
          font-weight: 600;
          text-align: center;
        }

        .landing-features-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 32px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .landing-feature {
          padding: 24px;
          background: transparent;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .landing-feature-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          margin-bottom: 16px;
          color: var(--text-primary);
        }

        .landing-feature-icon iconify-icon {
          width: 24px;
          height: 24px;
        }

        .landing-feature-title {
          margin: 0 0 8px;
          font-size: 16px;
          font-weight: 600;
        }

        .landing-feature-desc {
          margin: 0;
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .landing-footer {
          display: flex;
          justify-content: center;
          gap: 32px;
          padding: 20px 8vw;
          background: transparent;
        }

        .landing-footer a {
          font-size: 14px;
          color: var(--text-secondary);
          text-decoration: none;
        }

        .landing-footer a:hover {
          color: var(--accent);
        }

        @media (max-width: 900px) {
          .landing-features-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 600px) {
          .landing-hero-title {
            font-size: 32px;
          }

          .landing-hero-subtitle {
            font-size: 16px;
          }

          .landing-header {
            padding: 12px 5vw;
          }

          .landing-hero, .landing-features {
            padding-left: 5vw;
            padding-right: 5vw;
          }

          .landing-footer {
            padding: 20px 5vw;
          }

          .landing-features-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

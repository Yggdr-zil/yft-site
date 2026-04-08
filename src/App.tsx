import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import './App.css'

function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

const floatAnim = {
  y: [0, -10, 2, -6, 0],
  rotate: [0, 0.4, -0.3, 0.2, 0],
}
const floatTransition = {
  duration: 9, repeat: Infinity, ease: 'easeInOut' as const, repeatType: 'mirror' as const,
}

function LogoMark() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  return (
    <motion.div
      ref={ref}
      className="hero-logo-wrap"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
    >
      <motion.img
        src="/ygg-mark-t.png"
        alt="Yggdrasil mark"
        className="hero-logo-img"
        animate={floatAnim}
        transition={floatTransition}
      />
    </motion.div>
  )
}

function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('sending')
    const data = Object.fromEntries(new FormData(e.currentTarget))
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      setStatus(res.ok ? 'sent' : 'error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <div className="form-success">
        <p className="form-success-title">Message received.</p>
        <p className="form-success-sub">We'll be in touch.</p>
      </div>
    )
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Name</label>
          <input name="name" className="form-input" placeholder="Your name" required />
        </div>
        <div className="form-group">
          <label className="form-label">Organization</label>
          <input name="fund" className="form-input" placeholder="Company or fund" />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Email</label>
        <input name="email" type="email" className="form-input" placeholder="you@example.com" required />
      </div>
      <div className="form-group">
        <label className="form-label">Message</label>
        <textarea name="message" className="form-textarea"
          placeholder="What brings you here?"
          rows={4} required />
      </div>
      <button type="submit" className="form-submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Send →'}
      </button>
      {status === 'error' && (
        <p className="form-error">Something went wrong — please email <a href="mailto:inquiries@yggfin.tech">inquiries@yggfin.tech</a> directly.</p>
      )}
    </form>
  )
}

export default function App() {
  useEffect(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    document.documentElement.style.scrollBehavior = 'auto'
    window.scrollTo(0, 0)
    document.documentElement.style.scrollBehavior = ''
  }, [])

  return (
    <div className="site">

      {/* ── Nav ── */}
      <nav className="nav">
        <div className="nav-inner">
          <a href="#" className="nav-logo">
            <img src="/logo.png" alt="Yggdrasil" />
            <span>Yggdrasil</span>
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="hero-wrap">
        <section className="hero">
          <div className="hero-grid">
            <div className="hero-text">
              <FadeUp delay={0.1}>
                <p className="overline">Compute Derivatives Infrastructure</p>
              </FadeUp>
              <FadeUp delay={0.2}>
                <h1>One unit.<br />All accelerators.</h1>
              </FadeUp>
              <FadeUp delay={0.3}>
                <p className="hero-sub">
                  The settlement-grade standard for compute pricing.
                </p>
              </FadeUp>
              <FadeUp delay={0.4}>
                <div className="stats-row">
                  <div className="stat-item">
                    <div className="stat-value">56</div>
                    <div className="stat-label">Accelerators</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">28</div>
                    <div className="stat-label">Providers</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">Real-time</div>
                    <div className="stat-label">Collection</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">API</div>
                    <div className="stat-label">Coming soon</div>
                  </div>
                </div>
              </FadeUp>
            </div>
            <LogoMark />
          </div>
        </section>
      </div>

      {/* ── Contact ── */}
      <div id="contact">
        <div style={{ height: '1px', background: 'var(--border)' }} />
        <section className="contact-section">
          <div className="contact-grid">
            <FadeUp delay={0.1} className="contact-left">
              <h2 className="contact-h2">Get in touch</h2>
              <p className="contact-sub">
                Interested in compute pricing infrastructure, data access,
                or partnership opportunities.
              </p>
              <a href="mailto:inquiries@yggfin.tech" className="contact-link">
                inquiries@yggfin.tech
              </a>
            </FadeUp>
            <FadeUp delay={0.25} className="contact-right">
              <ContactForm />
            </FadeUp>
          </div>
        </section>
      </div>

      {/* ── Footer ── */}
      <div style={{ height: '1px', background: 'var(--border)' }} />
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-logo">
            <img src="/logo.png" alt="Yggdrasil" />
            <span>Yggdrasil Financial Technologies Inc.</span>
          </div>
          <p className="footer-note">Dallas, TX</p>
        </div>
      </footer>

    </div>
  )
}

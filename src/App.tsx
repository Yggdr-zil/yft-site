import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import './App.css'

function AnimatedLine({ delay = 0 }: { delay?: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  return (
    <div ref={ref} style={{ height: '1px', background: 'transparent', overflow: 'hidden' }}>
      <motion.div
        initial={{ scaleX: 0, transformOrigin: 'left' }}
        animate={inView ? { scaleX: 1 } : {}}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay }}
        style={{ height: '100%', background: 'var(--border)', transformOrigin: 'left' }}
      />
    </div>
  )
}

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
      {/* Main logo */}
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

function ScrollNudge() {
  return (
    <div className="scroll-nudge">
      <svg className="scroll-mouse" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <rect x="7" y="2" width="10" height="16" rx="5" />
        <motion.line
          x1="12" y1="6" x2="12" y2="9"
          strokeLinecap="round"
          animate={{ y1: [6, 8, 6], y2: [9, 11, 9] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </svg>
      <motion.svg
        className="scroll-chevron"
        viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"
        animate={{ y: [0, 5, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <polyline points="6 9 12 15 18 9" />
      </motion.svg>
    </div>
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
        <p className="form-success-sub">We'll be in touch at the email you provided.</p>
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
          <label className="form-label">Fund / Organization</label>
          <input name="fund" className="form-input" placeholder="Fund name" />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Email</label>
        <input name="email" type="email" className="form-input" placeholder="you@fund.com" required />
      </div>
      <div className="form-group">
        <label className="form-label">Message</label>
        <textarea name="message" className="form-textarea"
          placeholder="Tell us about your fund and interest in compute derivatives infrastructure..."
          rows={4} required />
      </div>
      <button type="submit" className="form-submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Send Inquiry →'}
      </button>
      {status === 'error' && (
        <p className="form-error">Something went wrong — please email <a href="mailto:investors@yggfin.tech">investors@yggfin.tech</a> directly.</p>
      )}
    </form>
  )
}

export default function App() {
  useEffect(() => {
    // Blur any browser-restored focus (contact form etc) then hard-snap to top
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    document.documentElement.style.scrollBehavior = 'auto'
    window.scrollTo(0, 0)
    document.documentElement.style.scrollBehavior = ''
  }, [])

  return (
    <div className="site">

      {/* ── Navigation ── */}
      <nav className="nav">
        <div className="nav-inner">
          <a href="#" className="nav-logo">
            <img src="/logo.png" alt="Yggdrasil" />
            <span>Yggdrasil</span>
          </a>
          <ul className="nav-links">
            <li><a href="#index">Index</a></li>
            <li><a href="#market">Market</a></li>
            <li><a href="#moat">Differentiation</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
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
              <h1>The Compute<br />Unit Index</h1>
            </FadeUp>
            <FadeUp delay={0.3}>
              <p className="hero-sub">
                The first physics-constrained, settlement-grade standard for GPU compute pricing.
                Built for regulated derivatives markets.
              </p>
            </FadeUp>
            <FadeUp delay={0.4}>
              <div className="stats-row">
                <div className="stat-item">
                  <div className="stat-value">56</div>
                  <div className="stat-label">Accelerators tracked</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">28</div>
                  <div className="stat-label">Cloud providers</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">Real-time</div>
                  <div className="stat-label">Live pricing</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">Patent<br /><span className="stat-pending">Pending</span></div>
                  <div className="stat-label">USPTO · Jan 9, 2026</div>
                </div>
              </div>
            </FadeUp>
          </div>
          <LogoMark />
        </div>
      </section>
      <ScrollNudge />
      </div>

      {/* ── Section 1: Index ── */}
      <div id="index">
        <AnimatedLine />
        <section className="full-section">
          <FadeUp delay={0.05}>
            <p className="section-number">01 — Index Methodology</p>
            <h2>Cross-GPU Normalization<br />No One Else Has Solved</h2>
          </FadeUp>
          <div className="full-section-body">
            <FadeUp delay={0.1} className="full-col">
              <p className="description">
                The Compute Unit (CU) is the normalization layer. It establishes a single,
                deterministic score per accelerator — anchored to an immutable reference point —
                that makes cross-GPU comparison possible at all. Without it, an H100 price and
                an MI300X price are just two different numbers with no common basis.
              </p>
              <p className="description">
                The Empirical Compute Unit (eCU) is the index. It captures actual delivered
                compute from live cloud instances — what a buyer is genuinely receiving per
                dollar, not what a datasheet claims. TCU and ICU sub-indices carry the same
                split for training-heavy and inference-heavy workloads.
              </p>
              <p className="description">
                The spread between CU and eCU is a signal in its own right: it measures how
                much real-world performance a provider is delivering versus hardware spec —
                varying by provider, hardware age, and utilization. No one else can produce
                this number.
              </p>
            </FadeUp>
            <FadeUp delay={0.2} className="full-col">
              <p className="description">
                CU anchors settlement. eCU is what procurement desks and quants actually
                trade on. Any counterparty can independently verify every settlement price
                from the published methodology and manufacturer data sheets — the architectural
                requirement for listing on a regulated market.
              </p>
              <p className="description">
                Software stack variables — ecosystem maturity, driver depth — are explicitly
                excluded from the index and left for operators to factor into their own
                procurement decisions.
              </p>
              <p className="description">
                For a technical deep-dive, <a href="mailto:inquiries@yggfin.tech" className="inline-link">reach out directly</a>.
              </p>
              <div className="key-stats">
                <div className="key-stat">
                  <div className="ks-value">CU · TCU · ICU</div>
                  <div className="ks-label">Normalization layer · spec-anchored</div>
                </div>
                <div className="key-stat">
                  <div className="ks-value">eCU · eTCU · eICU</div>
                  <div className="ks-label">The index · delivered compute per $</div>
                </div>
                <div className="key-stat">
                  <div className="ks-value">3.2M rows</div>
                  <div className="ks-label">Historical price data</div>
                </div>
              </div>
            </FadeUp>
          </div>
        </section>
      </div>

      {/* ── Section 2: Market ── */}
      <div id="market">
        <AnimatedLine />
        <section className="split-section">
          <div className="split-text">
            <FadeUp delay={0.05}>
              <p className="section-number">02 — Market Structure</p>
              <h2>$400 Billion in AI Capex.<br />No Price Standard.</h2>
              <p className="description">
                Hyperscaler AI infrastructure spend reached ~$400B in 2025 and is projected to
                surpass $600B in 2026 — a 74% year-over-year increase.{' '}
                <span className="cite">¹</span>{' '}
                GPU compute prices swing 30–50% quarter-over-quarter as supply chains tighten
                and new architectures release.
              </p>
              <p className="description">
                Every commodity that became a financial market first needed a settlement-grade
                benchmark. WTI crude. LIBOR. VIX. The Compute Unit Index is that benchmark for
                GPU compute — built for regulated markets from the ground up.
                No exchange-listed, regulated hedging instrument for GPU compute exists today.
              </p>
              <div className="key-stats">
                <div className="key-stat">
                  <div className="ks-value">$400B+</div>
                  <div className="ks-label">2025 AI capex <span className="cite-inline">¹</span></div>
                </div>
                <div className="key-stat">
                  <div className="ks-value">30–50%</div>
                  <div className="ks-label">Quarterly price swing</div>
                </div>
                <div className="key-stat">
                  <div className="ks-value">Zero</div>
                  <div className="ks-label">Regulated hedging instruments</div>
                </div>
              </div>
              <p className="footnote"><span className="cite">¹</span> Goldman Sachs, CNBC, IEEE ComSoc — hyperscaler AI infrastructure capex, 2025 actuals / 2026 projections</p>
            </FadeUp>
          </div>
          <div className="split-aside">
            <FadeUp delay={0.2}>
              <div className="market-card">
                <p className="market-card-label">Revenue Pathway</p>
                <div className="pathway">
                  <div className="pathway-step active">
                    <span className="step-num">1</span>
                    <div>
                      <div className="step-title">API + Data Subscriptions</div>
                      <div className="step-sub">Direct licensing · months 1–6</div>
                    </div>
                  </div>
                  <div className="pathway-connector" />
                  <div className="pathway-step">
                    <span className="step-num">2</span>
                    <div>
                      <div className="step-title">Bloomberg + Refinitiv Feed</div>
                      <div className="step-sub">Index licensing · months 6–9</div>
                    </div>
                  </div>
                  <div className="pathway-connector" />
                  <div className="pathway-step">
                    <span className="step-num">3</span>
                    <div>
                      <div className="step-title">OTC Cleared Swap</div>
                      <div className="step-sub">First trade · months 12–18</div>
                    </div>
                  </div>
                  <div className="pathway-connector" />
                  <div className="pathway-step">
                    <span className="step-num">4</span>
                    <div>
                      <div className="step-title">Exchange-Listed Futures</div>
                      <div className="step-sub">CBOE/CME · Series A milestone</div>
                    </div>
                  </div>
                </div>
              </div>
            </FadeUp>
          </div>
        </section>
      </div>

      {/* ── Section 3: Moat ── */}
      <div id="moat">
        <AnimatedLine />
        <section className="split-section">
          <div className="split-text">
            <FadeUp delay={0.05}>
              <p className="section-number">03 — Differentiation</p>
              <h2>Three Structural Advantages.<br />No Competitor Has All Three.</h2>
              <p className="description">
                Over $45M has been raised by teams building GPU compute derivatives. None have
                reached a regulated exchange. The approaches are structurally different — not
                competing implementations of the same method.
              </p>
              <p className="description">
                Both aggregate raw spot price data. Without a normalization layer, an H100 and
                an A100 price are not comparable — liquidity stays fractured across GPU types
                and generations, and neither approach produces a settlement price a counterparty
                can independently verify from published inputs.
              </p>
              <p className="description">
                Yggdrasil aggregates price data, runs proprietary benchmarks that track real
                hardware degradation over time, and normalizes everything to an immutable
                reference point — producing a settlement price any counterparty can reproduce
                from published inputs.
              </p>
              <p className="description">
                Yggdrasil is the only approach designed from day one for settlement-grade
                auditability, IOSCO compliance, and the exchange path that unlocks the full market.
              </p>
              <div className="key-stats">
                <div className="key-stat">
                  <div className="ks-value">Patent pending</div>
                  <div className="ks-label">USPTO · priority Jan 9, 2026</div>
                </div>
                <div className="key-stat">
                  <div className="ks-value">Deterministic</div>
                  <div className="ks-label">Settlement-reproducible</div>
                </div>
                <div className="key-stat">
                  <div className="ks-value">IOSCO-path</div>
                  <div className="ks-label">Built for regulators</div>
                </div>
              </div>
            </FadeUp>
          </div>
          <div className="split-aside">
            <FadeUp delay={0.2}>
              <div className="compare-card">
                <p className="market-card-label">Competitive Landscape</p>
                <table className="compare-table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Crypto-native</th>
                      <th>ML-based</th>
                      <th className="yft-col">Yggdrasil</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Approach</td>
                      <td className="cell-no">Price agg.</td>
                      <td className="cell-no">Price agg.</td>
                      <td className="cell-yes yft-col">Norm. index</td>
                    </tr>
                    <tr>
                      <td>Liquidity</td>
                      <td className="cell-no">Fractured</td>
                      <td className="cell-no">Fractured</td>
                      <td className="cell-yes yft-col">Unified</td>
                    </tr>
                    <tr>
                      <td>Verifiable</td>
                      <td className="cell-no">✕</td>
                      <td className="cell-no">✕</td>
                      <td className="cell-yes yft-col">✓</td>
                    </tr>
                    <tr>
                      <td>Patent</td>
                      <td className="cell-no">—</td>
                      <td className="cell-no">—</td>
                      <td className="cell-yes yft-col">Pending</td>
                    </tr>
                    <tr>
                      <td>Combined raised</td>
                      <td colSpan={2} style={{ textAlign: 'center' }}>$45M+</td>
                      <td className="yft-col">Seed</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </FadeUp>
          </div>
        </section>
      </div>

      {/* ── Credibility Strip ── */}
      <AnimatedLine />
      <section className="cred-strip">
        <FadeUp>
          <div className="cred-items">
            <div className="cred-item">
              <div className="cred-value">Patent Pending</div>
              <div className="cred-label">USPTO · Priority Jan 9, 2026</div>
            </div>
            <div className="cred-sep" />
            <div className="cred-item">
              <div className="cred-value">Delaware C-Corp</div>
              <div className="cred-label">Incorporated March 6, 2026</div>
            </div>
            <div className="cred-sep" />
            <div className="cred-item">
              <div className="cred-value">IOSCO Roadmap</div>
              <div className="cred-label">Principles for Financial Benchmarks</div>
            </div>
            <div className="cred-sep" />
            <div className="cred-item">
              <div className="cred-value">$3M Seed</div>
              <div className="cred-label">$12M pre-money · Dallas, TX</div>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ── Contact ── */}
      <div id="contact">
        <AnimatedLine />
        <section className="contact-section">
          <div className="contact-grid">
            <FadeUp delay={0.1} className="contact-left">
              <p className="overline">Investor Inquiries</p>
              <h2 className="contact-h2">Raising $3M Seed</h2>
              <p className="contact-sub">
                We're in stealth. Announcing mid-March 2026. If you're a fintech or deep-tech
                infrastructure investor and this interests you, reach out directly.
              </p>
              <a href="mailto:investors@yggfin.tech" className="contact-link">
                investors@yggfin.tech
              </a>
              <a href="mailto:inquiries@yggfin.tech" className="contact-link contact-link--secondary">
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
      <AnimatedLine />
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-logo">
            <img src="/logo.png" alt="Yggdrasil" />
            <span>Yggdrasil Financial Technologies Inc.</span>
          </div>
          <p className="footer-note">Delaware C-Corp · Dallas, TX · Patent Pending</p>
        </div>
      </footer>

    </div>
  )
}

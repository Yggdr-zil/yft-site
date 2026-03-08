import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import './App.css'

// Animated horizontal rule that draws from left to right when in view
function AnimatedLine({ delay = 0 }: { delay?: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  return (
    <div ref={ref} style={{ height: '1px', background: 'var(--border)', overflow: 'hidden' }}>
      <motion.div
        initial={{ scaleX: 0, transformOrigin: 'left' }}
        animate={inView ? { scaleX: 1 } : {}}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay }}
        style={{ height: '100%', background: 'var(--border)', transformOrigin: 'left' }}
      />
    </div>
  )
}

// Fade + slide up for content blocks
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

export default function App() {
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
      <section className="hero">
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
              <div className="stat-value">Patent<br /><span style={{ fontSize: '1rem' }}>Pending</span></div>
              <div className="stat-label">USPTO · Jan 9, 2026</div>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ── Section 1: Index ── */}
      <div id="index">
        <AnimatedLine />
        <section className="split-section">
          <div className="split-text">
            <FadeUp delay={0.05}>
              <p className="section-number">01 — Index Methodology</p>
              <h2>Cross-GPU Normalization<br />No One Else Has Solved</h2>
              <p className="description">
                The CU (Compute Unit) index uses a physics-grounded geometric mean across four hardware dimensions —
                floating-point throughput, memory bandwidth, VRAM capacity, and interconnect bandwidth —
                to produce a single, deterministic score per accelerator.
              </p>
              <p className="description">
                Unlike competing approaches that rely on ML models or governance-dependent basket recompositions,
                the CU index is fully reproducible from published inputs. Any counterparty can independently
                verify every settlement price. This is the architectural requirement for exchange listing.
              </p>
              <div className="key-stats">
                <div className="key-stat">
                  <div className="ks-value">CU · TCU · ICU</div>
                  <div className="ks-label">Three sub-indices</div>
                </div>
                <div className="key-stat">
                  <div className="ks-value">3.2M rows</div>
                  <div className="ks-label">Historical data</div>
                </div>
                <div className="key-stat">
                  <div className="ks-value">CFTC-designed</div>
                  <div className="ks-label">From day one</div>
                </div>
              </div>
            </FadeUp>
          </div>
          <div className="split-aside">
            <FadeUp delay={0.2}>
              <div className="formula-card">
                <p className="formula-label">TCU (Training Compute Unit)</p>
                <code className="formula">
                  TCU = FP<sup>0.43</sup> × BW<sup>0.22</sup> × VRAM<sup>0.55</sup> × IC<sup>0.11</sup>
                </code>
                <p className="formula-note">Geometric mean, normalized to H100 SXM reference (TCU = 1.0)</p>
                <div className="formula-divider" />
                <p className="formula-label">ICU (Inference Compute Unit)</p>
                <code className="formula">
                  ICU = FP<sup>0.60</sup> × BW<sup>0.28</sup> × VRAM<sup>0.73</sup> × IC<sup>0.05</sup>
                </code>
                <p className="formula-note">Higher VRAM weight — inference is memory-bound</p>
              </div>
            </FadeUp>
          </div>
        </section>
      </div>

      {/* ── Section 2: Market ── */}
      <div id="market">
        <AnimatedLine />
        <section className="split-section reverse">
          <div className="split-text">
            <FadeUp delay={0.05}>
              <p className="section-number">02 — Market Structure</p>
              <h2>An $800B Market with<br />No Price Standard</h2>
              <p className="description">
                Global cloud AI infrastructure spend exceeds $800B annually. GPU compute prices swing 40%
                quarter-over-quarter as supply chains tighten and new architectures release. Hyperscalers,
                AI labs, and enterprise buyers have zero hedging instruments.
              </p>
              <p className="description">
                Every commodity that became a financial market first needed a settlement-grade benchmark.
                WTI crude. LIBOR. VIX. The Compute Unit Index is that benchmark for GPU compute —
                built for CBOE, CME, and OTC cleared markets from the ground up.
              </p>
              <div className="key-stats">
                <div className="key-stat">
                  <div className="ks-value">$800B+</div>
                  <div className="ks-label">Annual AI capex</div>
                </div>
                <div className="key-stat">
                  <div className="ks-value">40%</div>
                  <div className="ks-label">Quarterly price swing</div>
                </div>
                <div className="key-stat">
                  <div className="ks-value">$0</div>
                  <div className="ks-label">Hedging available today</div>
                </div>
              </div>
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
                      <div className="step-title">Bloomberg Data Feed</div>
                      <div className="step-sub">Index licensing · months 6–9</div>
                    </div>
                  </div>
                  <div className="pathway-connector" />
                  <div className="pathway-step">
                    <span className="step-num">2</span>
                    <div>
                      <div className="step-title">OTC Cleared Swap</div>
                      <div className="step-sub">First trade · months 12–18</div>
                    </div>
                  </div>
                  <div className="pathway-connector" />
                  <div className="pathway-step">
                    <span className="step-num">3</span>
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
              <h2>Three Moats. No Competitor<br />Has All Three.</h2>
              <p className="description">
                Three companies have raised a combined $45M building GPU compute derivatives.
                None can access a regulated exchange. Ornn lacks cross-GPU normalization —
                a governance crisis with every architecture transition. Silicon Data's ML model
                is non-deterministic: no counterparty can reproduce the settlement price from
                published inputs. CFTC will not approve it. CME will not list it.
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
                      <th>Ornn</th>
                      <th>Silicon Data</th>
                      <th className="yft-col">Yggdrasil</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Cross-GPU norm.</td>
                      <td className="cell-no">✕</td>
                      <td className="cell-no">✕</td>
                      <td className="cell-yes yft-col">✓</td>
                    </tr>
                    <tr>
                      <td>Deterministic</td>
                      <td className="cell-no">✕</td>
                      <td className="cell-no">✕</td>
                      <td className="cell-yes yft-col">✓</td>
                    </tr>
                    <tr>
                      <td>CME/CBOE path</td>
                      <td className="cell-no">Blocked</td>
                      <td className="cell-no">Blocked</td>
                      <td className="cell-yes yft-col">Open</td>
                    </tr>
                    <tr>
                      <td>Patent</td>
                      <td className="cell-no">—</td>
                      <td className="cell-no">—</td>
                      <td className="cell-yes yft-col">Pending</td>
                    </tr>
                    <tr>
                      <td>Raised</td>
                      <td>$5.7M</td>
                      <td>$4.7M</td>
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
          <FadeUp delay={0.1}>
            <p className="overline">Investor Inquiries</p>
            <h2 className="contact-h2">Raising $3M Seed</h2>
            <p className="contact-sub">
              We're in stealth. Announcing mid-March 2026. If you're a fintech or deep-tech
              infrastructure investor and this interests you, reach out directly.
            </p>
            <a href="mailto:investors@yggdrasil.tech" className="contact-link">
              investors@yggdrasil.tech
            </a>
          </FadeUp>
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

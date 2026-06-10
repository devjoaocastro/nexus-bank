import { useEffect, useRef } from 'react'
import { scrollToPage } from '../scrollBus'

/* ------------------------------------------------------------------ */
/* Animated counter — counts up when it scrolls into view.             */
/* ------------------------------------------------------------------ */

function Counter({
  to,
  decimals = 0,
  prefix = '',
  suffix = '',
}: {
  to: number
  decimals?: number
  prefix?: string
  suffix?: string
}) {
  const el = useRef<HTMLSpanElement>(null!)
  const started = useRef(false)

  useEffect(() => {
    const node = el.current
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return
        started.current = true
        const t0 = performance.now()
        const DURATION = 1800
        const tick = (now: number) => {
          const t = Math.min(1, (now - t0) / DURATION)
          const eased = 1 - Math.pow(1 - t, 3)
          node.textContent = `${prefix}${(to * eased).toFixed(decimals)}${suffix}`
          if (t < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      },
      { threshold: 0.4 },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [to, decimals, prefix, suffix])

  return (
    <span ref={el}>
      {prefix}
      {(0).toFixed(decimals)}
      {suffix}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Footer data — compliance-heavy link grid.                           */
/* ------------------------------------------------------------------ */

const FOOTER_COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'Accounts', href: 'https://nexus.bank/product/accounts' },
      { label: 'Payments', href: 'https://nexus.bank/product/payments' },
      { label: 'Treasury', href: 'https://nexus.bank/product/treasury' },
      { label: 'Cards', href: 'https://nexus.bank/product/cards' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: 'https://nexus.bank/company/about' },
      { label: 'Careers', href: 'https://nexus.bank/company/careers' },
      { label: 'Press', href: 'mailto:press@nexus.bank' },
      { label: 'Blog', href: 'https://nexus.bank/blog' },
    ],
  },
  {
    title: 'Developers',
    links: [
      { label: 'API reference', href: 'https://docs.nexus.bank/api' },
      { label: 'SDKs', href: 'https://docs.nexus.bank/sdks' },
      { label: 'Changelog', href: 'https://docs.nexus.bank/changelog' },
      { label: 'Status', href: 'https://status.nexus.bank' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of service', href: 'https://nexus.bank/legal/terms' },
      { label: 'Privacy policy', href: 'https://nexus.bank/legal/privacy' },
      { label: 'Imprint', href: 'https://nexus.bank/legal/imprint' },
      { label: 'Cookie notice', href: 'https://nexus.bank/legal/cookies' },
    ],
  },
  {
    title: 'Compliance',
    links: [
      { label: 'Licenses', href: 'https://nexus.bank/compliance/licenses' },
      { label: 'AML policy', href: 'https://nexus.bank/compliance/aml' },
      { label: 'Complaints', href: 'mailto:complaints@nexus.bank' },
      { label: 'Report vulnerability', href: 'mailto:security@nexus.bank' },
    ],
  },
]

/* ------------------------------------------------------------------ */
/* Interface — all scrolled DOM content, one 100vh section per page.   */
/* ------------------------------------------------------------------ */

export default function Interface() {
  return (
    <div className="interface">
      {/* 0 — Hero */}
      <section className="section section--center section--hero">
        <p className="tagline">Digital private bank · Berlin → EU</p>
        <h1 className="hero-title">
          Banking for <em>builders</em>.
        </h1>
        <p className="hero-sub">
          Accounts, payments and treasury for companies that ship. Money as
          infrastructure — programmable, instant, audited.
        </p>
        <button className="cta" onClick={() => scrollToPage(2)}>
          See the product ↓
        </button>
        <div className="scroll-hint">
          <span className="scroll-hint__line" />
          <span className="scroll-hint__label">scroll</span>
        </div>
      </section>

      {/* 1 — Thesis */}
      <section className="section section--left" data-num="01">
        <p className="kicker">01 — Thesis</p>
        <h2>
          Your money should ship
          <br />
          as <em>fast</em> as you do.
        </h2>
        <p className="body">
          Deploys take seconds. Wires take days. We rebuilt the bank account as a
          piece of infrastructure: every balance an API, every transfer an event,
          every ledger entry yours to query. No branches, no queues, no fax
          machines — just rails.
        </p>
      </section>

      {/* 2 — Product */}
      <section className="section section--left" data-num="02">
        <p className="kicker">02 — Product</p>
        <ul className="features">
          <li>
            <span>01</span>
            <div>
              <strong>Instant SEPA &amp; SWIFT</strong>
              <p>Payouts settle in seconds, 24/7 — weekends and holidays included.</p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <strong>Sub-accounts as code</strong>
              <p>Spin up ledgers with a POST request — limits, roles and webhooks per account.</p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <strong>4.2% on idle cash</strong>
              <p>Treasury yield on every euro that sleeps, accrued daily, withdrawable anytime.</p>
            </div>
          </li>
        </ul>
        <p className="hint">→ hover the network</p>
      </section>

      {/* 3 — Security */}
      <section className="section section--left" data-num="03">
        <p className="kicker">03 — Security</p>
        <h2>
          Built like a vault.
          <br />
          <em>Audited</em> like one too.
        </h2>
        <p className="body">
          Custody with BaFin-regulated partners. Keys split 3-of-5. Client funds
          held in segregated accounts, never on our balance sheet. Every internal
          action is signed, logged and reviewed.
        </p>
        <ul className="badges" aria-label="Certifications">
          <li>SOC 2 Type II</li>
          <li>PSD2</li>
          <li>ISO 27001</li>
          <li>GDPR</li>
        </ul>
        <p className="hint">→ click the vault</p>
      </section>

      {/* 4 — Growth */}
      <section className="section section--center" data-num="04">
        <p className="kicker">04 — Growth</p>
        <h2>
          Compounding, <em>quietly</em>.
        </h2>
        <div className="stats">
          <div>
            <strong>
              <Counter to={2.4} decimals={1} prefix="€" suffix="B" />
            </strong>
            <span>processed</span>
          </div>
          <div>
            <strong>
              <Counter to={18} suffix="k" />
            </strong>
            <span>companies</span>
          </div>
          <div>
            <strong>
              <Counter to={99.99} decimals={2} suffix="%" />
            </strong>
            <span>uptime</span>
          </div>
        </div>
      </section>

      {/* 5 — Pricing */}
      <section className="section section--left" data-num="05">
        <p className="kicker">05 — Pricing</p>
        <h2>
          Pay for <em>scale</em>, not seats.
        </h2>
        <ul className="tiers">
          <li>
            <div className="tiers__name">
              <strong>Start</strong>
              <span>For the first invoice. One account, instant SEPA, the full API.</span>
            </div>
            <div className="tiers__price">
              €0<small>/mo</small>
            </div>
          </li>
          <li>
            <div className="tiers__name">
              <strong>Scale</strong>
              <span>Unlimited sub-accounts, SWIFT, treasury yield, priority support.</span>
            </div>
            <div className="tiers__price">
              €49<small>/mo</small>
            </div>
          </li>
          <li>
            <div className="tiers__name">
              <strong>Enterprise</strong>
              <span>Dedicated IBAN ranges, SLAs, custom approval flows, named engineer.</span>
            </div>
            <div className="tiers__price">Custom</div>
          </li>
        </ul>
        <a className="cta" href="mailto:sales@nexus.bank">
          Talk to sales
        </a>
      </section>

      {/* 6 — Footer */}
      <section className="section section--footer">
        <div className="footer-head">
          <h2 className="footer-head__title">
            Open in <em>minutes</em>.
          </h2>
          <a className="cta cta--big" href="mailto:hello@nexus.bank">
            hello@nexus.bank
          </a>
        </div>

        <div className="footer-grid">
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title} className="footer-grid__col">
              <h3>{col.title}</h3>
              <ul>
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="footer-legal">
          NEXUS is a technology company, not a bank. Banking services are provided
          by partner institutions licensed in the European Union; client funds are
          held in segregated safeguarding accounts with BaFin-regulated credit
          institutions and are not available to NEXUS creditors. Deposits placed
          through partner banks are protected up to €100,000 per depositor under
          the applicable EU deposit guarantee scheme. Treasury yield reflects the
          current rate on qualifying balances, is variable, accrues daily and is
          not a guarantee of future returns. Payment services are provided under
          the EU Payment Services Directive (PSD2). Nothing on this page is
          investment, legal or tax advice.
        </p>

        <p className="footer-reg">
          NEXUS Technologies GmbH is registered with the German Federal Financial
          Supervisory Authority (BaFin) as an agent of its partner institutions —
          License No. DE-ZAG-2024-0847 · Commercial Register: Amtsgericht
          Charlottenburg, HRB 248317 B.
        </p>

        <div className="footer-langs" aria-label="Language">
          <button className="is-active" aria-pressed="true">
            EN
          </button>
          <button aria-pressed="false">DE</button>
          <button aria-pressed="false">PT</button>
        </div>

        <div className="footer-bottom">
          <span>© NEXUS Technologies GmbH 2026 · Berlin</span>
          <a className="footer-status" href="https://status.nexus.bank">
            <span className="footer-status__dot" aria-hidden="true" />
            All systems operational
          </a>
        </div>
      </section>
    </div>
  )
}

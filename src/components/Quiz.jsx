import { useState } from 'react'
import { calculateEligibility } from './eligibility'

// ── All quiz steps (both paths share this list) ──────────────────────────────
// Couples/family path:  age → citizenship → buyerType → partnerCitizenship → income → propertyOwnership
// Singles path:         age → citizenship → buyerType → widowedOrphan      → income → propertyOwnership
const QUIZ_STEPS = ['age','citizenship','buyerType','partnerCitizenship','widowedOrphan','income','propertyOwnership']

// Returns which steps THIS user will actually see (for progress bar)
function getEffectiveSteps(answers) {
  const isSingle = answers.buyerType === 'single_alone' || answers.buyerType === 'single_joint'
  if (isSingle) return ['age','citizenship','buyerType','widowedOrphan','income','propertyOwnership']
  return ['age','citizenship','buyerType','partnerCitizenship','income','propertyOwnership']
}

// ── Branching ────────────────────────────────────────────────────────────────
function getNextStep(currentStep, answers) {
  if (currentStep === 'age') {
    return answers.age < 21 ? 'exitSchool' : 'citizenship'
  }
  if (currentStep === 'citizenship') {
    return answers.citizenship === 'foreigner' ? 'exitForeigner' : 'buyerType'
  }
  if (currentStep === 'buyerType') {
    const isSingle = answers.buyerType === 'single_alone' || answers.buyerType === 'single_joint'
    const isPR     = answers.citizenship === 'pr'
    if (isSingle && isPR) return 'exitSinglePR'
    if (isSingle)         return 'widowedOrphan'
    return 'partnerCitizenship'
  }
  if (currentStep === 'partnerCitizenship') return 'income'
  if (currentStep === 'widowedOrphan')      return 'income'
  if (currentStep === 'income')             return 'propertyOwnership'
  if (currentStep === 'propertyOwnership')  return 'leadCapture'
  if (currentStep === 'leadCapture')        return 'results'
  return null
}

function getPrevStep(currentStep, answers) {
  if (currentStep === 'citizenship')        return 'age'
  if (currentStep === 'buyerType')          return 'citizenship'
  if (currentStep === 'partnerCitizenship') return 'buyerType'
  if (currentStep === 'widowedOrphan')      return 'buyerType'
  if (currentStep === 'income') {
    const isSingle = answers.buyerType === 'single_alone' || answers.buyerType === 'single_joint'
    return isSingle ? 'widowedOrphan' : 'partnerCitizenship'
  }
  if (currentStep === 'propertyOwnership')  return 'income'
  if (currentStep === 'leadCapture')        return 'propertyOwnership'
  if (currentStep === 'exitForeigner')      return 'citizenship'
  if (currentStep === 'exitSchool')         return 'age'
  if (currentStep === 'exitSinglePR')       return 'buyerType'
  return null
}

// ── Questions config ─────────────────────────────────────────────────────────
const QUESTIONS = {
  citizenship: {
    title: "What’s your citizenship status?",
    subtitle: 'This determines which property types you can buy.',
    layout: 'image', cols: 1,
    options: [
      { value: 'sc',        emoji: '🇸🇬', bg: '#E6F1FB', label: 'Singapore Citizen',     desc: 'Born or naturalised SC' },
      { value: 'pr',        emoji: '📋',              bg: '#E1F5EE', label: 'Singapore PR',           desc: 'Permanent Resident' },
      { value: 'foreigner', emoji: '✈️',              bg: '#FAEEDA', label: 'Foreigner / EP Holder',  desc: 'Non-citizen, non-PR' },
    ],
  },
  buyerType: {
    title: 'How are you buying?',
    subtitle: 'Your household type affects your eligibility and grants.',
    layout: 'image', cols: 2,
    options: [
      { value: 'fiancee',      emoji: '💍', bg: '#EEEDFE', label: 'Fiancé / Fiancée',               desc: 'Engaged, not yet married' },
      { value: 'married',      emoji: '💑', bg: '#FBEAF0', label: 'Married — no children',               desc: 'Already married, no kids yet' },
      { value: 'family',       emoji: '👨‍👩‍👧', bg: '#E1F5EE', label: 'Married / Family with children', desc: 'With SC child, or single parent' },
      { value: 'single_joint', emoji: '👥', bg: '#E6F1FB', label: 'Two singles together',            desc: 'Friends or siblings' },
      { value: 'single_alone', emoji: '🧍', bg: '#FAEEDA', label: 'Single — buying alone',             desc: 'Buying on your own' },
    ],
  },
  partnerCitizenship: {
    title: "What is your partner’s citizenship?",
    subtitle: 'This affects your property eligibility and grant amounts.',
    layout: 'image', cols: 1,
    options: [
      { value: 'sc',        emoji: '🇸🇬', bg: '#E6F1FB', label: 'Singapore Citizen', desc: 'Born or naturalised SC' },
      { value: 'pr',        emoji: '📋',              bg: '#E1F5EE', label: 'Singapore PR',       desc: 'Permanent Resident' },
      { value: 'foreigner', emoji: '✈️',              bg: '#FAEEDA', label: 'Foreigner',          desc: 'Non-citizen, non-PR' },
    ],
  },
  widowedOrphan: {
    title: 'Are you widowed or an orphan?',
    subtitle: 'This may affect your age eligibility for HDB flat purchase.',
    layout: 'image', cols: 2,
    options: [
      { value: 'yes', emoji: '🤝', bg: '#E1F5EE', label: 'Yes', desc: 'Widowed, or both parents have passed away' },
      { value: 'no',  emoji: '🧍', bg: '#F1EFE8', label: 'No',  desc: 'Standard single applicant' },
    ],
  },
  income: {
    title: 'Monthly household income?',
    subtitle: 'Total combined income of all buyers in the application.',
    layout: 'text', cols: 2,
    options: [
      { value: 3000,  label: 'Below $3,000' },
      { value: 7000,  label: '$3,001 – $7,000' },
      { value: 10000, label: '$7,001 – $10,000' },
      { value: 14000, label: '$10,001 – $14,000' },
      { value: 16000, label: '$14,001 – $16,000' },
      { value: 20000, label: 'Above $16,000' },
    ],
  },
  propertyOwnership: {
    title: 'Do you currently own any property?',
    subtitle: 'This affects your eligibility and first-timer grant status.',
    layout: 'image', cols: 1,
    options: [
      { value: 'none',    emoji: '🔑', bg: '#E1F5EE', label: 'No — first-time buyer',  desc: 'Never owned property before' },
      { value: 'hdb',     emoji: '🏢', bg: '#E6F1FB', label: 'I own an HDB flat',           desc: 'Looking to upgrade or rightsize' },
      { value: 'private', emoji: '🏡', bg: '#FAEEDA', label: 'I own private property',      desc: 'Condo, landed, or overseas' },
    ],
  },
}

// ── Result page property metadata ────────────────────────────────────────────
const PROP_META = {
  bto:         { tag: 'New HDB',    title: 'BTO Flat',         emoji: '🏢', bg: '#E6F1FB', subtitle: 'New flat from HDB. More affordable, 3–5 year wait.' },
  resale:      { tag: 'Resale HDB', title: 'HDB Resale Flat',  emoji: '🏠', bg: '#E1F5EE', subtitle: 'Buy from an existing owner. Move in faster.' },
  ec:          { tag: 'EC',         title: 'Executive Condo',  emoji: '🏙️', bg: '#FAEEDA', subtitle: 'Hybrid public-private housing. Condo facilities, lower price.' },
  privateProp: { tag: 'Private',    title: 'Private Property', emoji: '🏡', bg: '#F1EFE8', subtitle: 'Condos, landed, new launches. No income ceiling.' },
}

// ── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [step, setStep]       = useState('intro')
  const [answers, setAnswers] = useState({})
  const [lead, setLead]       = useState({ name: '', email: '', phone: '' })
  const [results, setResults] = useState(null)
  const [recordId, setRecordId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [animKey, setAnimKey] = useState(0)

  const goTo = (s) => { setAnimKey(k => k + 1); setStep(s) }

  const handleAnswer = (stepKey, value) => {
    const updated = { ...answers, [stepKey]: value }
    setAnswers(updated)
    goTo(getNextStep(stepKey, updated))
  }

  const handleBack = () => {
    const prev = getPrevStep(step, answers)
    if (prev) goTo(prev)
  }

const submitLead = async () => {
    setSubmitting(true)
    const res = calculateEligibility(answers)
    setResults(res)

    try {
      const response = await fetch('/api/submit-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead, answers, eligibility: res }),
      })
      const data = await response.json()
      if (data.recordId) setRecordId(data.recordId)
    } catch (err) {
      console.error('Lead submission failed:', err)
    }

    setSubmitting(false)
    goTo('results')
  }

  const handleRestart = () => {
    setAnswers({})
    setLead({ name: '', email: '', phone: '' })
    setResults(null)
    goTo('intro')
  }

  const effectiveSteps = getEffectiveSteps(answers)
  const quizStepIndex  = effectiveSteps.indexOf(step)
  const quizTotalSteps = effectiveSteps.length
  const showBack       = step !== 'intro' && step !== 'results'

  return (
    <div className="app">
      <header className="header">
        <div className="logo">HomeCheck<span className="logo-sg">SG</span></div>
        {showBack && <button className="back-btn" onClick={handleBack}>← Back</button>}
      </header>

      <main className="main">
        <div key={animKey} className={`screen-anim${step === 'results' ? ' screen-anim--wide' : ''}`}>

          {step === 'intro' && <IntroScreen onStart={() => goTo('age')} />}

          {step === 'age' && (
            <AgeInputScreen
              stepIndex={quizStepIndex}
              totalSteps={quizTotalSteps}
              selected={answers['age']}
              onAnswer={(v) => handleAnswer('age', v)}
            />
          )}

          {QUIZ_STEPS.includes(step) && step !== 'age' && (
            <QuizScreen
              stepKey={step}
              question={QUESTIONS[step]}
              stepIndex={quizStepIndex}
              totalSteps={quizTotalSteps}
              selected={answers[step]}
              onAnswer={(v) => handleAnswer(step, v)}
            />
          )}

          {step === 'exitForeigner'  && <ExitForeignerScreen  lead={lead} setLead={setLead} onSubmit={submitLead} />}
          {step === 'exitSchool'     && <ExitSchoolScreen     age={answers.age}             onRestart={handleRestart} />}
          {step === 'exitSinglePR'   && <ExitSinglePRScreen   lead={lead} setLead={setLead} onSubmit={submitLead} />}
          {step === 'leadCapture'    && <LeadScreen           lead={lead} setLead={setLead} onSubmit={submitLead} submitting={submitting} />}
          {step === 'results' && results && (
            <ResultsScreen results={results} leadName={lead.name} recordId={recordId} onRestart={handleRestart} />
          )}

        </div>
      </main>

      <footer className="footer">
        <p>Based on HDB guidelines as of 2025. For official information visit{' '}
          <a href="https://www.hdb.gov.sg" target="_blank" rel="noopener noreferrer">hdb.gov.sg</a>
        </p>
      </footer>
    </div>
  )
}

// ── Intro ────────────────────────────────────────────────────────────────────
function IntroScreen({ onStart }) {
  return (
    <div className="intro-hero">
      <div className="intro-eyebrow">A Singapore Property Guide</div>
      <h1 className="intro-headline">What can you actually buy?</h1>
      <p className="intro-body">A friendly 2-minute guide to your property eligibility, with grant estimates.</p>
      <button className="btn-primary intro-cta" onClick={onStart}>Check my eligibility →</button>
      <p className="intro-note">Free · No obligation · No sign-up needed</p>
    </div>
  )
}

// ── Progress bar ─────────────────────────────────────────────────────────────
function QuizProgress({ stepIndex, totalSteps }) {
  const pct = Math.round(((stepIndex + 1) / totalSteps) * 100)
  return <div className="quiz-prog"><div className="quiz-prog-fill" style={{ width: `${pct}%` }} /></div>
}

// ── Age input ────────────────────────────────────────────────────────────────
function AgeInputScreen({ onAnswer, stepIndex, totalSteps, selected }) {
  const [value, setValue] = useState(selected ? String(selected) : '')
  const [error, setError] = useState('')

  const submit = () => {
    const age = parseInt(value)
    if (!value || isNaN(age)) { setError('Please enter your age.'); return }
    if (age < 1 || age > 120) { setError('Please enter a valid age between 1 and 120.'); return }
    onAnswer(age)
  }

  return (
    <div className="quiz-screen">
      <QuizProgress stepIndex={stepIndex} totalSteps={totalSteps} />
      <div className="quiz-step-bg">01</div>
      <div className="quiz-step-label">Step {stepIndex + 1} of {totalSteps}</div>
      <h2 className="question-title">How old are you?</h2>
      <p className="question-subtitle">Enter your age and press continue.</p>
      <div className="age-input-wrap">
        <input
          className="age-input" type="number" min="1" max="120" placeholder="28"
          value={value} autoFocus
          onChange={e => { setValue(e.target.value); setError('') }}
          onKeyDown={e => e.key === 'Enter' && submit()}
        />
        <span className="age-unit">years old</span>
      </div>
      {error && <p className="age-error">{error}</p>}
      <button className={`btn-primary full-width ${!value ? 'disabled' : ''}`} onClick={submit} disabled={!value}>
        Continue →
      </button>
    </div>
  )
}

// ── Quiz screen ───────────────────────────────────────────────────────────────
function QuizScreen({ stepKey, question, stepIndex, totalSteps, selected, onAnswer }) {
  const stepNum = String(stepIndex + 1).padStart(2, '0')
  return (
    <div className="quiz-screen">
      <QuizProgress stepIndex={stepIndex} totalSteps={totalSteps} />
      <div className="quiz-step-bg">{stepNum}</div>
      <div className="quiz-step-label">Step {stepIndex + 1} of {totalSteps}</div>
      <h2 className="question-title">{question.title}</h2>
      {question.subtitle && <p className="question-subtitle">{question.subtitle}</p>}

      {question.layout === 'image' ? (
        <div className={`image-grid cols-${question.cols}`}>
          {question.options.map(opt => (
            <button
              key={opt.value}
              className={`image-opt ${selected === opt.value ? 'selected' : ''}`}
              onClick={() => onAnswer(opt.value)}
            >
              <div className="image-thumb" style={{ background: opt.bg }}>
                {opt.img
                  ? <img src={opt.img} alt={opt.label} className="image-thumb-img" />
                  : <span className="image-emoji">{opt.emoji}</span>}
              </div>
              <div className="image-check">✓</div>
              <div className="image-cap">
                <span className="image-label">{opt.label}</span>
                {opt.desc && <span className="image-desc">{opt.desc}</span>}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className={`text-grid cols-${question.cols}`}>
          {question.options.map(opt => (
            <button
              key={opt.value}
              className={`text-opt ${selected === opt.value ? 'selected' : ''}`}
              onClick={() => onAnswer(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Shared lead form fields ───────────────────────────────────────────────────
function LeadFields({ lead, setLead }) {
  return (
    <div className="form-fields">
      <div className="field-group">
        <label className="field-label">Your name *</label>
        <input className="field-input" type="text" placeholder="e.g. Wei Ling Tan"
          value={lead.name} onChange={e => setLead(p => ({ ...p, name: e.target.value }))} />
      </div>
      <div className="field-group">
        <label className="field-label">Email address *</label>
        <input className="field-input" type="email" placeholder="e.g. wltan@email.com"
          value={lead.email} onChange={e => setLead(p => ({ ...p, email: e.target.value }))} />
      </div>
      <div className="field-group">
        <label className="field-label">Phone number <span className="optional">(optional)</span></label>
        <input className="field-input" type="tel" placeholder="e.g. 9123 4567"
          value={lead.phone} onChange={e => setLead(p => ({ ...p, phone: e.target.value }))} />
      </div>
    </div>
  )
}

// ── Lead capture (main path) ──────────────────────────────────────────────────
function LeadScreen({ lead, setLead, onSubmit, submitting }) {
  const [consent, setConsent] = useState(false)
  const valid = lead.name.trim() && lead.email.trim() && consent && !submitting

  return (
    <div className="card lead-card">
      <div className="lead-icon">🎉</div>
      <h2 className="lead-title">Your results are ready</h2>
      <p className="lead-body">Enter your details and we'll show you exactly what you qualify for, with grant estimates included.</p>
      <LeadFields lead={lead} setLead={setLead} />
      <label className="consent-label">
        <input
          type="checkbox"
          checked={consent}
          onChange={e => setConsent(e.target.checked)}
          className="consent-checkbox"
        />
        <span>I agree to be contacted by a property specialist regarding my results. I consent to HomeCheckSG collecting and using my personal data in accordance with Singapore's PDPA.</span>
      </label>
      <button
        className={`btn-primary full-width ${!valid ? 'disabled' : ''}`}
        onClick={onSubmit}
        disabled={!valid}
      >
        {submitting ? 'Loading your results...' : 'See my property passport →'}
      </button>
      <p className="privacy-note">🔒 Your details are safe. No spam, ever.</p>
    </div>
  )
}

// ── Exit: Foreigner ───────────────────────────────────────────────────────────
function ExitForeignerScreen({ lead, setLead, onSubmit }) {
  const valid = lead.name.trim() && lead.email.trim()
  return (
    <div className="card exit-card">
      <div className="exit-icon">✈️</div>
      <div className="exit-badge">Foreigner</div>
      <h2 className="exit-title">You can buy private property in Singapore</h2>
      <p className="exit-body">HDB flats and Executive Condos are not available to foreigners. But the private property market is fully open — condos, new launches, and some landed homes.</p>
      <div className="exit-note"><strong>Note:</strong> A 60% Additional Buyer’s Stamp Duty (ABSD) applies. A specialist agent can help you navigate this.</div>
      <p className="exit-cta-label">Enter your details to see your private property options and connect with a specialist.</p>
      <LeadFields lead={lead} setLead={setLead} />
      <button className={`btn-primary full-width ${!valid ? 'disabled' : ''}`} onClick={onSubmit} disabled={!valid}>
        See my property options →
      </button>
      <p className="privacy-note">🔒 No spam, ever.</p>
    </div>
  )
}

// ── Exit: Under 21 ────────────────────────────────────────────────────────────
function ExitSchoolScreen({ age, onRestart }) {
  const isTeenBuyer = age >= 18 && age <= 20

  if (isTeenBuyer) {
    return (
      <div className="card exit-card">
        <div className="exit-icon">📋</div>
        <div className="exit-badge exit-badge-amber">Age {age}</div>
        <h2 className="exit-title">It’s possible — but complicated</h2>
        <p className="exit-body">Most buyers are 21 and above, but limited options exist between ages 18 and 20. Here’s what you’d need:</p>
        <div className="exit-note">
          <ul className="exit-list">
            <li>You must be <strong>married or engaged</strong> to form a valid family nucleus</li>
            <li><strong>Parental consent</strong> is required from both sets of parents</li>
            <li>Only <strong>resale HDB flats</strong> at this age — BTO is not available</li>
            <li><strong>Marriage certificate</strong> must be submitted within 3 months of completion</li>
          </ul>
          <p style={{ marginTop: '10px' }}>Our honest advice: waiting until 21 makes the process significantly simpler and opens more options.</p>
        </div>
        <button className="btn-primary full-width" onClick={onRestart}>Start over</button>
        <p className="privacy-note">Need help with the 18–20 process? Call HDB at 1800-225-5432</p>
      </div>
    )
  }

  return (
    <div className="card exit-card">
      <div className="exit-icon">📚</div>
      <div className="exit-badge exit-badge-green">Under 18</div>
      <h2 className="exit-title">Back to school for now! 🎒</h2>
      <p className="exit-body">You need to be at least 21 to buy a home in Singapore. You’ve got some time — use it well!</p>
      <div className="exit-note">
        <strong>Minimum ages in Singapore:</strong>
        <ul className="exit-list">
          <li>BTO flat — 21 years old</li>
          <li>Resale HDB — 21 (or 18 with parental consent + marriage)</li>
          <li>Singles scheme — 35 years old</li>
          <li>Private property — no minimum age</li>
        </ul>
      </div>
      <button className="btn-primary full-width" onClick={onRestart}>Start over</button>
    </div>
  )
}

// ── Exit: PR single ───────────────────────────────────────────────────────────
function ExitSinglePRScreen({ lead, setLead, onSubmit }) {
  const valid = lead.name.trim() && lead.email.trim()
  return (
    <div className="card exit-card">
      <div className="exit-icon">🏢</div>
      <div className="exit-badge exit-badge-amber">PR · Single</div>
      <h2 className="exit-title">Private property is your main option</h2>
      <p className="exit-body">As a PR buying alone or with another single, HDB flats are not available. HDB requires a valid family nucleus with a Singapore Citizen.</p>
      <div className="exit-note">
        <strong>Tip:</strong> If you are in a relationship with a Singapore Citizen and buy together as a couple or family, you may become eligible for HDB flats and EC. Start the quiz again with your partner’s details included.
      </div>
      <p className="exit-cta-label">Enter your details to see your private property options.</p>
      <LeadFields lead={lead} setLead={setLead} />
      <button className={`btn-primary full-width ${!valid ? 'disabled' : ''}`} onClick={onSubmit} disabled={!valid}>
        See my options →
      </button>
      <p className="privacy-note">🔒 No spam, ever.</p>
    </div>
  )
}

// ── Results ───────────────────────────────────────────────────────────────────
function ResultsScreen({ results, leadName, recordId, onRestart }) {
  const { bto, resale, ec, privateProp, grants } = results
  const firstName = leadName ? leadName.split(' ')[0] : ''
  const today = new Date().toLocaleDateString('en-SG', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <div className="results-wrapper">
      <div className="rpt-card">

        <div className="rpt-header">
          <div className="rpt-header-eyebrow">HomeCheckSG</div>
          <div className="rpt-header-row">
            <div>
              <h2 className="rpt-header-title">Property Report</h2>
              {firstName && <p className="rpt-header-sub">Prepared for {firstName}</p>}
            </div>
            <div className="rpt-header-date">
              Generated<br />{today}<br />HDB rules 2026
            </div>
          </div>
        </div>

        <div className="rpt-body">
          <div className="rpt-section-title">Eligibility Summary</div>
          <div className="rpt-stack">
            <EligibilityCard meta={PROP_META.bto}         result={bto} />
            <EligibilityCard meta={PROP_META.resale}       result={resale} />
            <EligibilityCard meta={PROP_META.ec}           result={ec} />
            <EligibilityCard meta={PROP_META.privateProp}  result={privateProp} />
          </div>

          <div className="rpt-section-title">Estimated Grants</div>
          <div className="rpt-grants">
            {grants.length > 0 ? (
              <>
                <div className="rpt-grants-title">Grants you may qualify for</div>
                <p className="rpt-grants-note">Actual amounts depend on your full HDB application. An agent or HDB officer can confirm.</p>
                {grants.map((g, i) => (
                  <div key={i} className={`rpt-grant-row ${i < grants.length - 1 ? 'rpt-grant-divider' : ''}`}>
                    <div className="rpt-grant-name">{g.name}</div>
                    <div className="rpt-grant-amount">{g.amount}</div>
                    <div className="rpt-grant-desc">{g.desc}</div>
                  </div>
                ))}
              </>
            ) : (
              <>
                <div className="rpt-grants-title">No grants available</div>
                <p className="rpt-grants-note">
                  CPF housing grants are only available to Singapore Citizens who are first-time buyers.
                  Grants are not available if you own existing property, are a PR, or are a foreigner.
                  Speak with an agent to explore other ways to reduce your purchase cost.
                </p>
              </>
            )}
          </div>

          <div className="rpt-disclaimer">
            General guidance based on HDB rules as of 2026. Not financial or legal advice.
            Always verify eligibility at{' '}
            <a href="https://www.hdb.gov.sg" target="_blank" rel="noopener noreferrer">hdb.gov.sg</a>
            {' '}or with a licensed property agent before making any application or financial commitment.
          </div>
        </div>

        <div className="rpt-footer">
          <button className="rpt-btn-ghost" onClick={onRestart}>Start over</button>
          <button className="rpt-btn-print" onClick={() => window.print()}>
            🖨 Print / Save PDF
          </button>
        </div>
      </div>

      <AgentRequestCard recordId={recordId} />
    </div>
  )
}

function AgentRequestCard({ recordId }) {
  const [status, setStatus] = useState('idle') // idle | loading | done | error

  const handleRequest = async () => {
    setStatus('loading')
    try {
      const res = await fetch('/api/request-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId }),
      })
      if (res.ok) {
        setStatus('done')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="card cta-card no-print">
      <div className="cta-icon">🤝</div>
      <h3 className="cta-title">Want personalised guidance?</h3>
      <p className="cta-body">
        Our partner agents specialise in first-time buyers. They can help you plan your
        timeline, check your CPF, and find the right home — at no cost to you.
      </p>

      {status === 'idle' && (
        <button className="btn-primary full-width" onClick={handleRequest}>
          Yes, I'd like an agent to contact me
        </button>
      )}

      {status === 'loading' && (
        <button className="btn-primary full-width disabled" disabled>
          Sending your request...
        </button>
      )}

      {status === 'done' && (
        <div className="agent-request-done">
          ✓ Request received — an agent will be in touch with you shortly
        </div>
      )}

      {status === 'error' && (
        <>
          <div className="agent-request-error">
            Something went wrong. Please try again or contact us directly.
          </div>
          <button className="btn-primary full-width" onClick={handleRequest} style={{ marginTop: '10px' }}>
            Try again
          </button>
        </>
      )}

      <p className="privacy-note" style={{ marginTop: '14px' }}>
        By clicking above you consent to being contacted by a property specialist
        regarding your results.
      </p>
    </div>
  )
}

function EligibilityCard({ meta, result }) {
  const STATUS = {
    eligible:   { label: 'Eligible',      cls: 'rpt-badge-g' },
    conditions: { label: 'Conditions',    cls: 'rpt-badge-a' },
    ineligible: { label: 'Not eligible',  cls: 'rpt-badge-r' },
  }
  const s = STATUS[result.status]

  return (
    <div className={`rpt-pc rpt-pc-${result.status}`}>
      <div className="rpt-pc-head">
        <span className="rpt-pc-icon">{meta.emoji}</span>
      <div className="rpt-pc-info">
        <div className="rpt-pc-tag">{meta.tag}</div>
        <div className="rpt-pc-name">{meta.title}</div>
        {meta.subtitle && <div className="rpt-pc-sub">{meta.subtitle}</div>}
      </div>
        <span className={`rpt-pc-badge ${s.cls}`}>● {s.label}</span>
      </div>
      {result.notes.length > 0 && (
        <ul className="rpt-pc-notes">
          {result.notes.map((n, i) => <li key={i}>{n}</li>)}
        </ul>
      )}
    </div>
  )
}
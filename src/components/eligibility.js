/**
 * HomeCheckSG — Property Eligibility Engine
 * Logic based on master reference document, June 2026
 * Source: hdb.gov.sg
 */

export function calculateEligibility(answers) {
  const {
    citizenship, buyerType, partnerCitizenship,
    widowedOrphan, age, income, propertyOwnership,
  } = answers

  // ── Applicant citizenship ───────────────────────────────────────────────────
  const isSC       = citizenship === 'sc'
  const isPR       = citizenship === 'pr'
  const isForeigner = citizenship === 'foreigner'

  // ── Buyer type ──────────────────────────────────────────────────────────────
  const isFiancee    = buyerType === 'fiancee'
  const isSingleJoint = buyerType === 'single_joint'
  const isSingleAlone = buyerType === 'single_alone'
  const isSingle     = isSingleAlone || isSingleJoint
  const isFamily     = !isSingle
  const hasScChild   = buyerType === 'family'      // Married/family with SC child

  // ── Widowed / orphan (from Q4b) ─────────────────────────────────────────────
  const isWidowedOrphan = widowedOrphan === 'yes'

  // ── Partner citizenship (from Q4a, couples/family only) ─────────────────────
  const partnerIsSC     = partnerCitizenship === 'sc'
  const partnerIsPR     = partnerCitizenship === 'pr'
  const partnerIsForeign = partnerCitizenship === 'foreigner'

  // ── Household composition ───────────────────────────────────────────────────
  const hasScInHousehold = isSC || (partnerIsSC && isFamily)
  const bothPR           = isPR && partnerIsPR && isFamily
  const nonCitizenSpouse = isSC && partnerIsForeign && isFamily   // SC + Foreigner partner

  // ── Age ─────────────────────────────────────────────────────────────────────
  const isUnder21 = age < 21
  const is35Plus  = age >= 35
  const is55Plus  = age >= 55

  // ── Property ownership (from Q6) ────────────────────────────────────────────
  const ownsPrivate = propertyOwnership === 'private'
  const ownsHDB     = propertyOwnership === 'hdb'
  const ownsNone    = propertyOwnership === 'none'

  // ════════════════════════════════════════════════════════════════════════════
  // BTO (New HDB Flat)
  // ════════════════════════════════════════════════════════════════════════════
  let bto = { status: 'ineligible', notes: [] }

  if (!hasScInHousehold) {
    bto.notes.push('At least one Singapore Citizen applicant is required for BTO.')
} else if (nonCitizenSpouse && income > 7000) {
    bto.notes.push('Non-Citizen Spouse Scheme: income ceiling is $7,000/month since you are restricted to 2-room Flexi flats. Your income exceeds this limit.')
  } else if (nonCitizenSpouse) {
    bto.status = 'conditions'
    bto.notes.push('Non-Citizen Spouse Scheme: restricted to 2-room Flexi flats in non-mature estates only.')
    bto.notes.push('Foreigner partner must hold a valid LTVP+, Employment Pass, or S Pass.')
    bto.notes.push('Income ceiling for this scheme is $7,000/month.')
    if (ownsPrivate) bto.notes.push('You must dispose of all private property and wait 30 months before applying for BTO.')
    if (ownsHDB)     bto.notes.push('You must sell your current HDB flat within 6 months of collecting your new flat keys.')
  } else if (isUnder21) {
    bto.notes.push('Minimum age for BTO is 21 years old.')
  } else if (isSingle && !is35Plus && !isWidowedOrphan) {
    bto.notes.push('Single applicants under 35 must be widowed or orphaned to buy BTO. Standard singles must be 35 or above.')
  } else if (isSingle && income > 7000) {
    bto.notes.push('Income ceiling for singles is $7,000/month for BTO. Your income exceeds this limit.')
  } else if (isFamily && income > 14000) {
    bto.notes.push('Income ceiling for families is $14,000/month for BTO. Your income exceeds this limit.')
  } else if (ownsPrivate) {
    bto.status = 'conditions'
    bto.notes.push('You must dispose of all private property and wait 30 months before applying for BTO.')
  } else {
    bto.status = 'eligible'
    if (ownsHDB) {
      bto.status = 'conditions'
      bto.notes.push('You must sell your current HDB flat within 6 months of collecting your new flat keys.')
    }
    if (isSingleAlone)                     bto.notes.push('Eligible for 2-room Flexi flats in non-mature estates only (Single SC Scheme).')
    if (isSingleJoint)   bto.notes.push('Eligible for 2-room Flexi flats only (Joint Singles Scheme). Up to 4 singles can co-apply, all must be SC aged 35+.')
    if (isSingle && isWidowedOrphan && !is35Plus) bto.notes.push('Age exception applies as a widowed or orphaned applicant — eligible from age 21.')
    if (is55Plus)                          bto.notes.push('Additional option: short-lease 2-room Flexi BTO (15–45 year lease). Income ceiling $14,000/month for this option.')
    if (isFiancee)                         bto.notes.push('Fiancé/fiancée scheme: marriage certificate must be submitted to HDB within 3 months of collecting keys.')
    if (hasScChild)                        bto.notes.push('You may qualify for the Parenthood Priority Scheme (FPPS) — up to 40% of BTO units reserved for eligible families with SC children.')
    if (isPR && partnerIsSC)               bto.notes.push('BTO eligible because your SC partner satisfies the citizenship requirement.')
  }

  // ════════════════════════════════════════════════════════════════════════════
  // HDB Resale
  // ════════════════════════════════════════════════════════════════════════════
  let resale = { status: 'ineligible', notes: [] }

  if (isForeigner) {
    resale.notes.push('Foreigners are not eligible to purchase HDB resale flats.')
  } else if (isPR && isSingle) {
    resale.notes.push('PRs buying alone or with another single cannot purchase HDB resale flats. A valid family nucleus with a Singapore Citizen is required.')
  } else if (isSC && isSingle && !is35Plus && !isWidowedOrphan) {
    resale.notes.push('Single SCs under 35 must be widowed or orphaned to buy a resale HDB flat. Standard singles must be 35 or above.')
} else if (isPR && partnerIsForeign && isFamily) {
    resale.notes.push('PRs cannot buy HDB resale flats with a foreigner partner. A valid Singapore Citizen in the household is required.')
  } else if (bothPR) {
    resale.status = 'conditions'
    resale.notes.push('SPR couple: both applicants must have held PR status for at least 3 years before purchase.')
    if (ownsHDB)     { resale.status = 'conditions'; resale.notes.push('You must sell your existing HDB flat within 6 months of completing this resale purchase.') }
    if (ownsPrivate) resale.notes.push('15-month wait-out period after selling private property before buying HDB resale.')
  } else if (ownsPrivate) {
    resale.status = 'conditions'
    resale.notes.push('15-month wait-out period after selling private property before buying HDB resale.')
  } else {
    resale.status = 'eligible'
if (isPR && isFamily)   resale.notes.push('As a PR, you must form an essential family nucleus with your Singapore Citizen partner.')
    if (ownsHDB)            { resale.status = 'conditions'; resale.notes.push('You must sell your existing HDB flat within 6 months of completing this resale purchase.') }
    if (is55Plus)                           resale.notes.push('Consider a smaller flat for rightsizing. You may qualify for the Silver Housing Bonus.')
    if (isFiancee)                          resale.notes.push('Fiancé/fiancée scheme: marriage certificate must be submitted within 3 months of resale completion.')
    if (isSingle && isWidowedOrphan && !is35Plus) resale.notes.push('Age exception applies as a widowed or orphaned applicant — eligible from age 21.')
    if (isSingle && income > 7000)          resale.notes.push('No CPF housing grants available for singles with income above $7,000/month.')
    if (isPR && partnerIsSC)                resale.notes.push('Eligible because your SC partner satisfies the family nucleus requirement.')
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Executive Condo (EC)
  // ════════════════════════════════════════════════════════════════════════════
let ec = { status: 'ineligible', notes: [] }

  if (!hasScInHousehold) {
    ec.notes.push('At least one Singapore Citizen applicant is required for an EC.')
    if (isPR && isFamily && partnerIsPR) ec.notes.push('If your partner becomes SC in the future, you may become eligible.')
  } else if (isSingleAlone) {
    ec.notes.push('Singles buying alone are not eligible for EC. Only the Joint Singles Scheme (2\u20134 people) qualifies.')
  } else if (isSingleJoint && !is35Plus) {
    ec.notes.push('Joint Singles Scheme for EC requires all applicants to be 35 or above. No age-21 exception applies, even if widowed or orphaned.')
  } else if (isUnder21) {
    ec.notes.push('Minimum age for EC is 21 years old.')
  } else if (income > 16000) {
    ec.notes.push('Income ceiling for EC is $16,000/month. Your income exceeds this limit.')
  } else if (ownsPrivate) {
    ec.status = 'conditions'
    ec.notes.push('You must not have disposed of any private property within the last 30 months.')
  } else {
    ec.status = 'eligible'
    if (isSingleJoint) ec.notes.push('Joint Singles Scheme: up to 4 single SCs aged 35+ may co-apply. No CPF housing grants available for EC as a single.')
    if (ownsHDB) {
      ec.status = 'conditions'
      ec.notes.push("You must sell your HDB flat within 6 months of the EC's Temporary Occupation Permit (TOP) date.")
    }
    if (income > 14000)    ec.notes.push('Your household income is below the $16,000/month EC ceiling — you are eligible.')
    if (isPR && partnerIsSC) ec.notes.push('EC eligible because your SC partner satisfies the citizenship requirement.')
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Private Property
  // ════════════════════════════════════════════════════════════════════════════
let privateProp = { status: 'eligible', notes: [] }

  if (isForeigner) {
    privateProp.notes.push('60% Additional Buyer\'s Stamp Duty (ABSD) applies on all private residential purchases.')
    privateProp.notes.push('Landed property requires approval from the Singapore Land Authority (SLA).')
  } else if (isPR) {
    if (ownsNone) {
      privateProp.notes.push('5% ABSD applies on your first private residential property purchase as a PR.')
    } else {
      privateProp.notes.push('30% ABSD applies as this would be your second residential property as a PR.')
      if (ownsHDB) privateProp.notes.push('You currently own an HDB flat — selling it does not reduce this ABSD rate.')
    }
  } else if (isSC && ownsHDB) {
    privateProp.notes.push('You may keep your HDB flat if it has met MOP, subject to the 6-month sale rule if buying with CPF housing grant history. 20% ABSD applies on this purchase as your second residential property.')
  } else if (isSC && ownsPrivate) {
    privateProp.notes.push('20% ABSD on second residential property, 30% on third and above.')
  } else {
    privateProp.notes.push('No ABSD on your first residential property purchase as a Singapore Citizen.')
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Grants
  // ════════════════════════════════════════════════════════════════════════════
  const grants = []

  if (hasScInHousehold && ownsNone) {
// EHG — Families (ranges based on quiz income brackets)
    if (isFamily) {
      if (income <= 3000) {
        grants.push({
          name: 'Enhanced CPF Housing Grant (EHG) — Families',
          amount: '$95,000 – $120,000',
          desc: 'Estimated range for your income bracket. Exact amount depends on your actual combined household income. For first-timer SC families with income ≤ $9,000/month. Available for BTO and resale.',
        })
      } else if (income <= 7000) {
        grants.push({
          name: 'Enhanced CPF Housing Grant (EHG) — Families',
          amount: '$30,000 – $90,000',
          desc: 'Estimated range for your income bracket. Exact amount depends on your actual combined household income. For first-timer SC families with income ≤ $9,000/month. Available for BTO and resale.',
        })
      } else if (income <= 10000) {
        grants.push({
          name: 'Enhanced CPF Housing Grant (EHG) — Families',
          amount: 'Up to $25,000',
          desc: 'Only applicable if your actual household income does not exceed $9,000/month. Households earning $7,001–$9,000 may qualify for $5,000–$25,000. Speak with an agent to confirm.',
        })
      }
    }

    // EHG — Singles
    if (isSingle && is35Plus && income <= 4500) {
      let amt = 'Up to $20,000'
      if (income <= 1500)      amt = 'Up to $60,000'
      else if (income <= 2000) amt = 'Up to $50,000'
      else if (income <= 2500) amt = 'Up to $40,000'
      else if (income <= 3000) amt = 'Up to $35,000'
      grants.push({
        name: 'Enhanced CPF Housing Grant (EHG) — Singles',
        amount: amt,
        desc: 'For eligible single SCs aged 35+. Income ≤ $4,500/month. Available for BTO and resale.',
      })
    }
    if (isFamily && income > 9000) {
      grants.push({
        name: 'CPF Housing Grants — Not Available',
        amount: 'Not eligible',
        desc: 'Your household income exceeds $9,000/month. CPF housing grants (EHG, Family Grant) are not available above this threshold. You can still purchase any flat type you are eligible for.',
      })
    }
// CPF Family Grant (resale) — amounts vary by flat size
    if (isFamily && resale.status === 'eligible') {
      const scsc = isSC && partnerIsSC
      grants.push({
        name: 'CPF Housing Grant (Family Grant)',
        amount: scsc
          ? '$80,000 (2–4 room) or $50,000 (5-room+)'
          : '$70,000 (2–4 room) or $40,000 (5-room+)',
        desc: scsc
          ? 'For first-timer SC+SC families buying a resale HDB flat. Amount depends on flat size.'
          : 'For first-timer SC+PR families buying a resale HDB flat. SC+PR households receive $10,000 less than SC+SC. Amount depends on flat size.',
      })
    }

    // PHG
    if (resale.status === 'eligible') {
      grants.push({
        name: 'Proximity Housing Grant (PHG)',
        amount: 'Up to $30,000',
        desc: 'Buy a resale flat to live with parents/children: $30,000. Within 4km of parents/children: $20,000. No income ceiling.',
      })
    }
    if (isSingle && income > 7000) {
      grants.push({
        name: 'CPF Housing Grants — Not Available',
        amount: 'Not eligible',
        desc: 'Your income exceeds $7,000/month. CPF housing grants for singles are not available above this threshold.',
      })
    }
    // CPF Singles Grant
    if (isSingle && is35Plus && income <= 7000 && resale.status === 'eligible') {
      grants.push({
        name: 'CPF Singles Grant',
        amount: 'Up to $40,000',
        desc: 'For SC singles aged 35+. $40,000 for 2–4-room resale flats; $25,000 for 5-room and above.',
      })
    }

    // EHG Singles
    if (isSingle && is35Plus && income <= 7000) {
      grants.push({
        name: 'Enhanced CPF Housing Grant (EHG) — Singles',
        amount: 'Up to $60,000',
        desc: 'From 20 August 2024, first-timer singles may qualify for an EHG (Singles) of up to $60,000. If you are buying with other first-timer single(s), up to 2 singles may each be eligible for an EHG (Singles), i.e., a total of up to $120,000.',
      })
    }
  }
  if (isSC && (ownsHDB || ownsPrivate) && isFamily) {
    grants.push({
      name: 'EHG — First & Second-Timer Couple',
      amount: 'Up to $60,000',
      desc: 'If one of you has never received a housing subsidy before (first-timer), you may still qualify for a reduced EHG based on half of your combined household income. Speak with an HDB officer or agent to confirm eligibility.',
    })
  }
  return { bto, resale, ec, privateProp, grants }
}

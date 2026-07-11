export async function handler(event) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const { lead, answers, eligibility } = JSON.parse(event.body)

  // Validate required fields
  if (!lead?.name || !lead?.email) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Name and email are required' }) }
  }

  // Format income for display
  const incomeLabels = {
    3000:  'Below $3,000',
    7000:  '$3,001 – $7,000',
    10000: '$7,001 – $10,000',
    14000: '$10,001 – $14,000',
    16000: '$14,001 – $16,000',
    20000: 'Above $16,000',
  }

  try {
    // ── Save to Airtable ────────────────────────────────────────────────────
    const airtableRes = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Leads`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            'Name':               lead.name,
            'Email':              lead.email,
            'Phone':              lead.phone || '',
            'Age':                answers.age || 0,
            'Citizenship':        answers.citizenship || '',
            'Buyer Type':         answers.buyerType || '',
            'Partner Citizenship': answers.partnerCitizenship || 'N/A',
            'Widowed or Orphan':  answers.widowedOrphan || 'N/A',
            'Income Bracket':     incomeLabels[answers.income] || '',
            'Owns Property':      answers.propertyOwnership || '',
            'BTO Eligibility':    eligibility?.bto?.status || '',
            'Resale Eligibility': eligibility?.resale?.status || '',
            'EC Eligibility':     eligibility?.ec?.status || '',
            'Private Eligibility': eligibility?.privateProp?.status || '',
            'Grants Count':       eligibility?.grants?.length || 0,
            'PDPA Consent':       true,
            'Submitted At':       new Date().toISOString(),
            'Source':             event.headers['referer'] || 'direct',
          },
        }),
      }
    )

    if (!airtableRes.ok) {
      const err = await airtableRes.json()
      console.error('Airtable error:', err)
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to save lead' }) }
    }

    // ── Email notification ───────────────────────────────────────────────────
    // Uses Resend (free tier: 3,000 emails/month)
    // Sign up at resend.com, get API key, add RESEND_API_KEY to env variables
    if (process.env.RESEND_API_KEY && process.env.NOTIFICATION_EMAIL) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'HomeCheckSG <onboarding@resend.dev>',
          to:      process.env.NOTIFICATION_EMAIL,
          subject: `New lead: ${lead.name}`,
          html: `
            <h2 style="color:#1C1A17">New HomeCheckSG Lead</h2>
            <table style="border-collapse:collapse;width:100%">
              <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Name</td><td style="padding:8px;border:1px solid #ddd">${lead.name}</td></tr>
              <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Email</td><td style="padding:8px;border:1px solid #ddd">${lead.email}</td></tr>
              <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Phone</td><td style="padding:8px;border:1px solid #ddd">${lead.phone || 'Not provided'}</td></tr>
              <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Age</td><td style="padding:8px;border:1px solid #ddd">${answers.age}</td></tr>
              <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Citizenship</td><td style="padding:8px;border:1px solid #ddd">${answers.citizenship}</td></tr>
              <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Buyer Type</td><td style="padding:8px;border:1px solid #ddd">${answers.buyerType}</td></tr>
              <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Income</td><td style="padding:8px;border:1px solid #ddd">${incomeLabels[answers.income] || ''}</td></tr>
              <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Owns Property</td><td style="padding:8px;border:1px solid #ddd">${answers.propertyOwnership}</td></tr>
              <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">BTO</td><td style="padding:8px;border:1px solid #ddd">${eligibility?.bto?.status}</td></tr>
              <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Resale</td><td style="padding:8px;border:1px solid #ddd">${eligibility?.resale?.status}</td></tr>
              <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">EC</td><td style="padding:8px;border:1px solid #ddd">${eligibility?.ec?.status}</td></tr>
              <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Private</td><td style="padding:8px;border:1px solid #ddd">${eligibility?.privateProp?.status}</td></tr>
              <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Grants</td><td style="padding:8px;border:1px solid #ddd">${eligibility?.grants?.length} grant(s) identified</td></tr>
            </table>
            <p style="margin-top:16px;color:#666;font-size:12px">Submitted at ${new Date().toLocaleString('en-SG', { timeZone: 'Asia/Singapore' })} SGT</p>
          `,
        }),
      })
    }

    const airtableData = await airtableRes.json()
    return { statusCode: 200, body: JSON.stringify({ success: true, recordId: airtableData.id }) }

  } catch (error) {
    console.error('Submit lead error:', error)
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) }
  }
}
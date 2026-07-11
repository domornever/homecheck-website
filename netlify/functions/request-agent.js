export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const { recordId } = JSON.parse(event.body)

  if (!recordId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Record ID is required' }) }
  }

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Leads/${recordId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            'Agent Contact Requested': true,
          },
        }),
      }
    )

    if (!response.ok) {
      const err = await response.json()
      console.error('Airtable update error:', err)
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to update record' }) }
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) }

  } catch (error) {
    console.error('Request agent error:', error)
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) }
  }
}
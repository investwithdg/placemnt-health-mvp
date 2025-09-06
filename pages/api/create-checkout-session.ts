import { NextApiRequest, NextApiResponse } from 'next'
import { createCheckoutSession } from '../../lib/stripe'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email, organizationName, contactName, phone } = req.body

    if (!email || !organizationName) {
      return res.status(400).json({ error: 'Email and organization name are required' })
    }

    const session = await createCheckoutSession(email, organizationName)

    res.status(200).json({ sessionId: session.id })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    res.status(500).json({ error: 'Failed to create checkout session' })
  }
} 
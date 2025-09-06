import { NextApiRequest, NextApiResponse } from 'next'
import { verifyWebhookSignature } from '../../../lib/stripe'
import { supabase } from '../../../lib/supabaseClient'
import Stripe from 'stripe'

export const config = {
  api: {
    bodyParser: false,
  },
}

async function buffer(readable: any) {
  const chunks = []
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const buf = await buffer(req)
  const sig = req.headers['stripe-signature'] as string

  let event: Stripe.Event

  try {
    event = verifyWebhookSignature(buf.toString(), sig)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return res.status(400).json({ error: 'Webhook signature verification failed' })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session
        
        // Update user status to paid
        if (session.metadata?.email) {
          const { error } = await supabase
            .from('users')
            .update({ 
              status: 'paid',
              stripe_customer_id: session.customer as string,
              role: 'employer'
            })
            .eq('email', session.metadata.email)

          if (error) {
            console.error('Error updating user status:', error)
          }
        }
        break

      case 'customer.subscription.deleted':
        const subscription = event.data.object as Stripe.Subscription
        
        // Update user status to suspended
        const { error } = await supabase
          .from('users')
          .update({ status: 'suspended' })
          .eq('stripe_customer_id', subscription.customer)

        if (error) {
          console.error('Error updating user status:', error)
        }
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    res.status(200).json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
} 
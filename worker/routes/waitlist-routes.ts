import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { waitlistSchema } from '../schemas';
import { z } from 'zod';

export type WaitlistSubmission = z.infer<typeof waitlistSchema>;

// Create a new router for waitlist routes
export const waitlistRouter = new Hono<{ Bindings: Env }>()
  .post(
    '/',
    zValidator('json', waitlistSchema),
    async (c) => {
      const { email } = c.req.valid('json');
      const db = c.env.WAITLIST_DB;

      try {
        // Check if email already exists
        const existingEmail = await db
          .prepare('SELECT email FROM waitlist WHERE email = ?')
          .bind(email)
          .first();

        if (existingEmail) {
          return c.json({ success: true, message: 'Email already registered' });
        }

        // Insert the new email
        await db
          .prepare('INSERT INTO waitlist (email, created_at) VALUES (?, ?)')
          .bind(email, new Date().toISOString())
          .run();

        return c.json({ 
          success: true, 
          message: 'Successfully joined the waitlist' 
        });
      } catch (error) {
        console.error('Waitlist submission error:', error);
        return c.json(
          { 
            success: false, 
            message: 'Failed to join waitlist. Please try again later.' 
          },
          500
        );
      }
    }
  );

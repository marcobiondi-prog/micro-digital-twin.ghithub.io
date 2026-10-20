import { createMiddleware } from '@tanstack/react-start'
import { requireSupabaseAuth } from './auth-middleware'

// Runs after requireSupabaseAuth: the role is read with the service client so a
// user can never grant themselves admin rights through RLS-visible data.
export const requireAdmin = createMiddleware({ type: 'function' })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const { supabaseAdmin } = await import('./client.server')
    const { data, error } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', context.userId)
      .eq('role', 'admin')
      .maybeSingle()
    if (error) throw new Error('Impossibile verificare i permessi di amministratore.')
    if (!data) throw new Error('Forbidden: serve il ruolo di amministratore.')
    const email = typeof context.claims['email'] === 'string' ? context.claims['email'] : null
    return next({ context: { adminEmail: email } })
  })

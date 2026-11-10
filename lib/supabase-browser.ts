/**
 * Shared Supabase Browser Client
 *
 * This module provides a singleton Supabase client instance to be used
 * across all browser-side components. This prevents the "Multiple GoTrueClient
 * instances detected" warning from Supabase auth-js.
 *
 * The client is created once and reused everywhere.
 */

'use client';

import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient<any> | null = null

/**
 * Get or create the shared Supabase browser client.
 * This ensures only one GoTrueClient instance exists in the browser context.
 */
export function getSupabaseBrowserClient(): SupabaseClient<any> {
  // Return existing client if we have one
  if (supabaseClient) {
    return supabaseClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL or anon key not configured in environment variables')
  }

  // Create client with browser-specific configuration
  supabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      // Prevent multiple GoTrueClient instances by using single-storage
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  }) as SupabaseClient<any>

  return supabaseClient
}

/**
 * Reset the Supabase client (useful for testing or reconfiguration).
 * Cleans up Realtime channels before resetting.
 */
export function resetSupabaseClient(): void {
  if (supabaseClient) {
    supabaseClient.removeAllChannels()
    supabaseClient = null
  }
}
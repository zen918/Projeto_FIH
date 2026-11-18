import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env, isDemo } from './env';

/**
 * Cliente com service role: usado apenas no servidor para operações de
 * persistência, Storage e administração de usuários. Nunca exponha esta chave
 * ao frontend.
 */
export const supabaseAdmin: SupabaseClient | null = isDemo
  ? null
  : createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

/**
 * Cliente anônimo: usado para login e validação de tokens JWT emitidos pelo
 * Supabase Auth.
 */
export const supabasePublic: SupabaseClient | null = isDemo
  ? null
  : createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

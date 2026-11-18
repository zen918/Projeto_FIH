import { isDemo } from '../config/env';
import type { Store } from './contracts';
import { createMemoryStore } from './memory';
import { SupabaseStore } from './supabase';

/**
 * Store escolhido em tempo de inicialização:
 * - DEMO_MODE=true  -> dados em memória (não requer Supabase)
 * - DEMO_MODE=false -> Supabase (PostgreSQL + Auth + Storage)
 */
export const store: Store = isDemo ? createMemoryStore() : new SupabaseStore();

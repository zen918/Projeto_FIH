"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.store = void 0;
const env_1 = require("../config/env");
const memory_1 = require("./memory");
const supabase_1 = require("./supabase");
/**
 * Store escolhido em tempo de inicialização:
 * - DEMO_MODE=true  -> dados em memória (não requer Supabase)
 * - DEMO_MODE=false -> Supabase (PostgreSQL + Auth + Storage)
 */
exports.store = env_1.isDemo ? (0, memory_1.createMemoryStore)() : new supabase_1.SupabaseStore();
//# sourceMappingURL=index.js.map
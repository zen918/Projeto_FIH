"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseStore = void 0;
const supabase_1 = require("../config/supabase");
const str = (value, fallback = '') => (typeof value === 'string' ? value : fallback);
const num = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};
const nullableStr = (value) => (typeof value === 'string' && value.length > 0 ? value : null);
function mapUser(row) {
    return {
        id: str(row.id),
        fullName: str(row.full_name),
        email: str(row.email),
        passwordHash: null,
        role: row.role,
        status: row.status,
        avatarUrl: nullableStr(row.avatar_url),
        organizationName: str(row.organization_name),
        city: str(row.city),
        phone: str(row.phone),
        createdAt: str(row.created_at),
        updatedAt: str(row.updated_at),
    };
}
function mapCollection(row, florist) {
    return {
        id: str(row.id),
        floristId: str(row.florist_id),
        floristName: florist?.fullName ?? 'Floricultura parceira',
        floristOrganization: florist?.organizationName ?? 'Floricultura parceira',
        floristCity: florist?.city ?? '',
        weightKg: num(row.weight_kg),
        qualityStatus: row.quality_status,
        pickupDate: str(row.pickup_date).slice(0, 10),
        status: row.status,
        notes: str(row.notes),
        address: str(row.address),
        createdAt: str(row.created_at),
        updatedAt: str(row.updated_at),
    };
}
function mapBatch(row, collection, researcher) {
    return {
        id: str(row.id),
        batchCode: str(row.batch_code),
        collectionId: str(row.collection_id),
        researcherId: str(row.researcher_id),
        researcherName: researcher?.fullName ?? 'Pesquisador do laboratório',
        researcherOrganization: researcher?.organizationName ?? 'Laboratório FIH',
        formulaVersion: str(row.formula_version),
        weightProducedKg: num(row.weight_produced_kg),
        biodegradationDays: num(row.biodegradation_days),
        tensileStrength: num(row.tensile_strength),
        traceCode: str(row.trace_code),
        qrCodeUrl: str(row.qr_code_url),
        evidenceUrl: nullableStr(row.evidence_url),
        status: row.status,
        notes: str(row.notes),
        createdAt: str(row.created_at),
        updatedAt: str(row.updated_at),
        origin: collection
            ? {
                collectionId: collection.id,
                floristId: collection.floristId,
                floristName: collection.floristName,
                floristOrganization: collection.floristOrganization,
                floristCity: collection.floristCity,
                petalWeightKg: collection.weightKg,
                qualityStatus: collection.qualityStatus,
                pickupDate: collection.pickupDate,
            }
            : null,
    };
}
function mapOrder(row, client, batch) {
    return {
        id: str(row.id),
        clientId: str(row.client_id),
        clientName: client?.fullName ?? 'Cliente B2B',
        clientOrganization: client?.organizationName ?? 'Empresa parceira',
        batchId: str(row.batch_id),
        batchCode: batch?.batchCode ?? 'Lote',
        formulaVersion: batch?.formulaVersion ?? '',
        quantityKg: num(row.quantity_kg),
        packagingType: row.packaging_type,
        status: row.status,
        notes: str(row.notes),
        createdAt: str(row.created_at),
        updatedAt: str(row.updated_at),
    };
}
function fail(error, context) {
    throw new Error(`${context}: ${error?.message ?? 'erro desconhecido'}`);
}
class SupabaseStore {
    get db() {
        if (!supabase_1.supabaseAdmin) {
            throw new Error('Cliente Supabase administrativo indisponível.');
        }
        return supabase_1.supabaseAdmin;
    }
    async profilesByIds(ids) {
        const unique = Array.from(new Set(ids.filter(Boolean)));
        if (unique.length === 0)
            return new Map();
        const { data, error } = await this.db.from('profiles').select('*').in('id', unique);
        if (error)
            fail(error, 'Falha ao carregar perfis');
        return new Map((data ?? []).map((row) => [row.id, mapUser(row)]));
    }
    async fetchCollections(rows) {
        const florists = await this.profilesByIds(rows.map((row) => row.florist_id));
        return rows.map((row) => mapCollection(row, florists.get(row.florist_id)));
    }
    async collectionMapByIds(ids) {
        const unique = Array.from(new Set(ids.filter(Boolean)));
        if (unique.length === 0)
            return new Map();
        const { data, error } = await this.db.from('petal_collections').select('*').in('id', unique);
        if (error)
            fail(error, 'Falha ao carregar coletas');
        const collections = await this.fetchCollections((data ?? []));
        return new Map(collections.map((collection) => [collection.id, collection]));
    }
    async fetchBatches(rows) {
        const [collections, researchers] = await Promise.all([
            this.collectionMapByIds(rows.map((row) => row.collection_id)),
            this.profilesByIds(rows.map((row) => row.researcher_id)),
        ]);
        return rows.map((row) => mapBatch(row, collections.get(row.collection_id), researchers.get(row.researcher_id)));
    }
    async batchMapByIds(ids) {
        const unique = Array.from(new Set(ids.filter(Boolean)));
        if (unique.length === 0)
            return new Map();
        const { data, error } = await this.db.from('bioplastic_batches').select('*').in('id', unique);
        if (error)
            fail(error, 'Falha ao carregar lotes');
        const batches = await this.fetchBatches((data ?? []));
        return new Map(batches.map((batch) => [batch.id, batch]));
    }
    async fetchOrders(rows) {
        const [clients, batches] = await Promise.all([
            this.profilesByIds(rows.map((row) => row.client_id)),
            this.batchMapByIds(rows.map((row) => row.batch_id)),
        ]);
        return rows.map((row) => mapOrder(row, clients.get(row.client_id), batches.get(row.batch_id)));
    }
    async findUserById(id) {
        const { data, error } = await this.db.from('profiles').select('*').eq('id', id).maybeSingle();
        if (error)
            fail(error, 'Falha ao carregar perfil');
        return data ? mapUser(data) : null;
    }
    async findUserByEmail(email) {
        const { data, error } = await this.db
            .from('profiles')
            .select('*')
            .eq('email', email.trim().toLowerCase())
            .maybeSingle();
        if (error)
            fail(error, 'Falha ao carregar perfil');
        return data ? mapUser(data) : null;
    }
    async createUser(input) {
        const email = input.email.trim().toLowerCase();
        const { data: authData, error: authError } = await this.db.auth.admin.createUser({
            email,
            password: input.password,
            email_confirm: true,
            user_metadata: {
                full_name: input.fullName,
                role: input.role,
                organization_name: input.organizationName,
                city: input.city,
                phone: input.phone,
            },
        });
        if (authError || !authData.user) {
            if (/already|registered|exists/i.test(authError?.message ?? '')) {
                throw new Error('EMAIL_ALREADY_EXISTS');
            }
            throw new Error(`Falha ao criar usuário: ${authError?.message ?? 'erro desconhecido'}`);
        }
        const profilePayload = {
            full_name: input.fullName,
            email,
            phone: input.phone,
            organization_name: input.organizationName,
            city: input.city,
            role: input.role,
            status: input.status,
        };
        const { data: updated, error: updateError } = await this.db
            .from('profiles')
            .update(profilePayload)
            .eq('id', authData.user.id)
            .select('*')
            .maybeSingle();
        if (!updateError && updated)
            return mapUser(updated);
        // Fallback caso o trigger de criação automática de perfil não esteja instalado.
        const { data: inserted, error: insertError } = await this.db
            .from('profiles')
            .upsert({ id: authData.user.id, ...profilePayload }, { onConflict: 'id' })
            .select('*')
            .single();
        if (insertError)
            fail(insertError, 'Falha ao criar perfil');
        return mapUser(inserted);
    }
    async updateUser(id, patch) {
        const payload = {};
        if (patch.fullName !== undefined)
            payload.full_name = patch.fullName;
        if (patch.phone !== undefined)
            payload.phone = patch.phone;
        if (patch.organizationName !== undefined)
            payload.organization_name = patch.organizationName;
        if (patch.city !== undefined)
            payload.city = patch.city;
        if (patch.avatarUrl !== undefined)
            payload.avatar_url = patch.avatarUrl;
        if (patch.role !== undefined)
            payload.role = patch.role;
        if (patch.status !== undefined)
            payload.status = patch.status;
        if (Object.keys(payload).length === 0)
            return this.findUserById(id);
        payload.updated_at = new Date().toISOString();
        const { data, error } = await this.db
            .from('profiles')
            .update(payload)
            .eq('id', id)
            .select('*')
            .maybeSingle();
        if (error)
            fail(error, 'Falha ao atualizar perfil');
        return data ? mapUser(data) : null;
    }
    async listUsers() {
        const { data, error } = await this.db
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
        if (error)
            fail(error, 'Falha ao listar usuários');
        return (data ?? []).map(mapUser);
    }
    async listCollections(filter) {
        let query = this.db
            .from('petal_collections')
            .select('*')
            .order('created_at', { ascending: false });
        if (filter?.floristId)
            query = query.eq('florist_id', filter.floristId);
        const { data, error } = await query;
        if (error)
            fail(error, 'Falha ao listar coletas');
        return this.fetchCollections((data ?? []));
    }
    async getCollection(id) {
        const { data, error } = await this.db
            .from('petal_collections')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error)
            fail(error, 'Falha ao carregar coleta');
        if (!data)
            return null;
        const florists = await this.profilesByIds([data.florist_id]);
        return mapCollection(data, florists.get(data.florist_id));
    }
    async createCollection(input) {
        const { data, error } = await this.db
            .from('petal_collections')
            .insert({
            florist_id: input.floristId,
            weight_kg: input.weightKg,
            quality_status: input.qualityStatus,
            pickup_date: input.pickupDate,
            status: 'solicitada',
            notes: input.notes,
            address: input.address,
        })
            .select('*')
            .single();
        if (error)
            fail(error, 'Falha ao criar coleta');
        const florists = await this.profilesByIds([data.florist_id]);
        return mapCollection(data, florists.get(data.florist_id));
    }
    async updateCollection(id, patch) {
        const payload = { updated_at: new Date().toISOString() };
        if (patch.weightKg !== undefined)
            payload.weight_kg = patch.weightKg;
        if (patch.qualityStatus !== undefined)
            payload.quality_status = patch.qualityStatus;
        if (patch.pickupDate !== undefined)
            payload.pickup_date = patch.pickupDate;
        if (patch.notes !== undefined)
            payload.notes = patch.notes;
        if (patch.address !== undefined)
            payload.address = patch.address;
        if (patch.status !== undefined)
            payload.status = patch.status;
        const { error } = await this.db.from('petal_collections').update(payload).eq('id', id);
        if (error)
            fail(error, 'Falha ao atualizar coleta');
        return this.getCollection(id);
    }
    async listBatches() {
        const { data, error } = await this.db
            .from('bioplastic_batches')
            .select('*')
            .order('created_at', { ascending: false });
        if (error)
            fail(error, 'Falha ao listar lotes');
        return this.fetchBatches((data ?? []));
    }
    async getBatch(id) {
        const { data, error } = await this.db
            .from('bioplastic_batches')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error)
            fail(error, 'Falha ao carregar lote');
        if (!data)
            return null;
        const [collections, researchers] = await Promise.all([
            this.collectionMapByIds([data.collection_id]),
            this.profilesByIds([data.researcher_id]),
        ]);
        return mapBatch(data, collections.get(data.collection_id), researchers.get(data.researcher_id));
    }
    async getBatchByTraceCode(traceCode) {
        const { data, error } = await this.db
            .from('bioplastic_batches')
            .select('*')
            .eq('trace_code', traceCode.trim().toUpperCase())
            .maybeSingle();
        if (error)
            fail(error, 'Falha ao carregar rastreabilidade');
        if (!data)
            return null;
        const [collections, researchers] = await Promise.all([
            this.collectionMapByIds([data.collection_id]),
            this.profilesByIds([data.researcher_id]),
        ]);
        return mapBatch(data, collections.get(data.collection_id), researchers.get(data.researcher_id));
    }
    async createBatch(input) {
        const { data, error } = await this.db
            .from('bioplastic_batches')
            .insert({
            batch_code: input.batchCode,
            collection_id: input.collectionId,
            researcher_id: input.researcherId,
            formula_version: input.formulaVersion,
            weight_produced_kg: input.weightProducedKg,
            biodegradation_days: input.biodegradationDays,
            tensile_strength: input.tensileStrength,
            trace_code: input.traceCode,
            qr_code_url: input.qrCodeUrl,
            status: input.status ?? 'concluido',
            notes: input.notes,
        })
            .select('*')
            .single();
        if (error)
            fail(error, 'Falha ao criar lote');
        return (await this.getBatch(data.id));
    }
    async updateBatch(id, patch) {
        const payload = { updated_at: new Date().toISOString() };
        if (patch.status !== undefined)
            payload.status = patch.status;
        if (patch.notes !== undefined)
            payload.notes = patch.notes;
        if (patch.evidenceUrl !== undefined)
            payload.evidence_url = patch.evidenceUrl;
        const { error } = await this.db.from('bioplastic_batches').update(payload).eq('id', id);
        if (error)
            fail(error, 'Falha ao atualizar lote');
        return this.getBatch(id);
    }
    async listOrders(filter) {
        let query = this.db.from('orders').select('*').order('created_at', { ascending: false });
        if (filter?.clientId)
            query = query.eq('client_id', filter.clientId);
        const { data, error } = await query;
        if (error)
            fail(error, 'Falha ao listar pedidos');
        return this.fetchOrders((data ?? []));
    }
    async getOrder(id) {
        const { data, error } = await this.db.from('orders').select('*').eq('id', id).maybeSingle();
        if (error)
            fail(error, 'Falha ao carregar pedido');
        if (!data)
            return null;
        const [clients, batches] = await Promise.all([
            this.profilesByIds([data.client_id]),
            this.batchMapByIds([data.batch_id]),
        ]);
        return mapOrder(data, clients.get(data.client_id), batches.get(data.batch_id));
    }
    async createOrder(input) {
        const { data, error } = await this.db
            .from('orders')
            .insert({
            client_id: input.clientId,
            batch_id: input.batchId,
            quantity_kg: input.quantityKg,
            packaging_type: input.packagingType,
            status: 'solicitado',
            notes: input.notes,
        })
            .select('*')
            .single();
        if (error)
            fail(error, 'Falha ao criar pedido');
        return (await this.getOrder(data.id));
    }
    async updateOrder(id, patch) {
        const payload = { updated_at: new Date().toISOString() };
        if (patch.status !== undefined)
            payload.status = patch.status;
        if (patch.notes !== undefined)
            payload.notes = patch.notes;
        const { error } = await this.db.from('orders').update(payload).eq('id', id);
        if (error)
            fail(error, 'Falha ao atualizar pedido');
        return this.getOrder(id);
    }
}
exports.SupabaseStore = SupabaseStore;
//# sourceMappingURL=supabase.js.map
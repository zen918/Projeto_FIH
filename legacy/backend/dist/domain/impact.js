"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IMPACT_FACTORS = void 0;
exports.buildImpactMetrics = buildImpactMetrics;
exports.buildMonthlyImpact = buildMonthlyImpact;
/**
 * Fatores de conversão do MVP (estimativas documentadas para a banca).
 * São parâmetros transparentes e podem ser calibrados com dados reais do
 * laboratório sem alterar o restante do sistema.
 */
exports.IMPACT_FACTORS = {
    /** Rendimento médio do processo: kg de bioplástico por kg de pétalas. */
    bioplasticYield: 0.3,
    /** 1 kg de bioplástico substitui 1 kg de plástico fóssil (mesma massa). */
    fossilPlasticPerKg: 1,
    /** Massa média de uma sacola convencional (5 g). */
    bagWeightKg: 0.005,
    /** Emissões evitadas por kg de bioplástico em vez de plástico fóssil. */
    co2AvoidedPerKg: 3.2,
};
const round1 = (value) => Math.round(value * 10) / 10;
function buildImpactMetrics(petalsKg, bioplasticKg) {
    const petals = Math.max(0, petalsKg);
    const bioplastic = Math.max(0, bioplasticKg);
    return {
        petalsDivertedKg: round1(petals),
        bioplasticProducedKg: round1(bioplastic),
        fossilPlasticAvoidedKg: round1(bioplastic * exports.IMPACT_FACTORS.fossilPlasticPerKg),
        bagsEquivalent: Math.round(bioplastic / exports.IMPACT_FACTORS.bagWeightKg),
        co2AvoidedKg: round1(bioplastic * exports.IMPACT_FACTORS.co2AvoidedPerKg),
    };
}
const MONTH_LABELS = [
    'jan',
    'fev',
    'mar',
    'abr',
    'mai',
    'jun',
    'jul',
    'ago',
    'set',
    'out',
    'nov',
    'dez',
];
function buildMonthlyImpact(collections, batches, months = 6) {
    const now = new Date();
    const buckets = new Map();
    for (let offset = months - 1; offset >= 0; offset -= 1) {
        const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        buckets.set(key, {
            month: key,
            label: MONTH_LABELS[date.getMonth()],
            petalsKg: 0,
            bioplasticKg: 0,
        });
    }
    for (const collection of collections) {
        const date = new Date(collection.createdAt);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const bucket = buckets.get(key);
        if (bucket)
            bucket.petalsKg = round1(bucket.petalsKg + collection.weightKg);
    }
    for (const batch of batches) {
        const date = new Date(batch.createdAt);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const bucket = buckets.get(key);
        if (bucket)
            bucket.bioplasticKg = round1(bucket.bioplasticKg + batch.weightProducedKg);
    }
    return Array.from(buckets.values());
}
//# sourceMappingURL=impact.js.map
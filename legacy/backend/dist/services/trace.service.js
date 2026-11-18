"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TraceService = void 0;
const impact_1 = require("../domain/impact");
const errors_1 = require("../errors");
const repositories_1 = require("../repositories");
const QUALITY_LABELS = {
    excelente: 'excelente conservação',
    boa: 'boa conservação',
    regular: 'conservação regular',
    critica: 'estado crítico',
};
class TraceService {
    async getByCode(code) {
        const batch = await repositories_1.store.getBatchByTraceCode(code);
        if (!batch) {
            throw (0, errors_1.notFound)('Código de rastreio não encontrado. Confira o QR Code e tente novamente.');
        }
        const petals = batch.origin?.petalWeightKg ?? 0;
        const impact = (0, impact_1.buildImpactMetrics)(petals, batch.weightProducedKg);
        const timeline = [];
        if (batch.origin) {
            timeline.push({
                title: 'Coleta das pétalas',
                description: `${batch.origin.floristOrganization} (${batch.origin.floristCity}) disponibilizou ${batch.origin.petalWeightKg} kg de pétalas com ${QUALITY_LABELS[batch.origin.qualityStatus] ?? 'qualidade registrada'}.`,
                date: batch.origin.pickupDate,
            });
        }
        timeline.push({
            title: 'Pesquisa e formulação',
            description: `As pétalas foram processadas no ${batch.researcherOrganization} com a formulação ${batch.formulaVersion}.`,
            date: batch.createdAt,
        });
        timeline.push({
            title: 'Bioplástico pronto',
            description: `Lote ${batch.batchCode} com ${batch.weightProducedKg} kg, resistência de ${batch.tensileStrength} MPa e biodegradação estimada em ${batch.biodegradationDays} dias em solo.`,
            date: batch.createdAt,
        });
        timeline.push({
            title: 'Impacto circular',
            description: `Estima-se ${impact.fossilPlasticAvoidedKg} kg de plástico fóssil evitados e ${impact.bagsEquivalent} sacolas convencionais substituídas. Relação média de ${Math.round(impact_1.IMPACT_FACTORS.bioplasticYield * 100)}% entre pétalas e bioplástico.`,
            date: null,
        });
        return {
            batch: {
                batchCode: batch.batchCode,
                traceCode: batch.traceCode,
                formulaVersion: batch.formulaVersion,
                weightProducedKg: batch.weightProducedKg,
                biodegradationDays: batch.biodegradationDays,
                tensileStrength: batch.tensileStrength,
                status: batch.status,
                createdAt: batch.createdAt,
                evidenceUrl: batch.evidenceUrl,
            },
            origin: batch.origin
                ? {
                    floristName: batch.origin.floristName,
                    organizationName: batch.origin.floristOrganization,
                    city: batch.origin.floristCity,
                    petalWeightKg: batch.origin.petalWeightKg,
                    qualityStatus: batch.origin.qualityStatus,
                    pickupDate: batch.origin.pickupDate,
                    collectedAt: batch.createdAt,
                }
                : null,
            researcher: {
                name: batch.researcherName,
                organizationName: batch.researcherOrganization,
            },
            impact,
            timeline,
        };
    }
}
exports.TraceService = TraceService;
//# sourceMappingURL=trace.service.js.map
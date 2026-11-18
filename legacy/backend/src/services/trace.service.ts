import { buildImpactMetrics, IMPACT_FACTORS } from '../domain/impact';
import type { TraceResult } from '../domain/types';
import { notFound } from '../errors';
import { store } from '../repositories';

const QUALITY_LABELS: Record<string, string> = {
  excelente: 'excelente conservação',
  boa: 'boa conservação',
  regular: 'conservação regular',
  critica: 'estado crítico',
};

export class TraceService {
  async getByCode(code: string): Promise<TraceResult> {
    const batch = await store.getBatchByTraceCode(code);
    if (!batch) {
      throw notFound('Código de rastreio não encontrado. Confira o QR Code e tente novamente.');
    }

    const petals = batch.origin?.petalWeightKg ?? 0;
    const impact = buildImpactMetrics(petals, batch.weightProducedKg);

    const timeline: TraceResult['timeline'] = [];

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
      description: `Estima-se ${impact.fossilPlasticAvoidedKg} kg de plástico fóssil evitados e ${impact.bagsEquivalent} sacolas convencionais substituídas. Relação média de ${Math.round(IMPACT_FACTORS.bioplasticYield * 100)}% entre pétalas e bioplástico.`,
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

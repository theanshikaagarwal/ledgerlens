import { createTool } from '@mastra/core';
import { z } from 'zod';

export const tabpfnPredictorTool = createTool({
  id: 'tabpfn-invoice-risk-predictor',
  description: 'Predicts invoice late-payment probability and estimated delay in days using TabPFN-3.5 foundation model.',
  inputSchema: z.object({
    invoiceAmount: z.number().describe('Amount of the invoice in USD'),
    daysSinceIssued: z.number().describe('Days elapsed since invoice date'),
    clientHistoricalLateCount: z.number().describe('Number of times this client paid late in past'),
    clientAverageDaysToPay: z.number().describe('Historical average days to settle'),
    clientTotalInvoices: z.number().describe('Total invoices previously issued to client'),
  }),
  outputSchema: z.object({
    lateProbability: z.number(),
    predictedDelayDays: z.number(),
    riskTier: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  }),
  execute: async ({ context }) => {
    const { invoiceAmount, daysSinceIssued, clientHistoricalLateCount, clientAverageDaysToPay, clientTotalInvoices } = context;

    // Call Prior Labs TabPFN-3.5 endpoint
    const response = await fetch('https://api.priorlabs.ai/v1/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.TABPFN_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'tabpfn-3.5',
        features: {
          amount: invoiceAmount,
          elapsed_days: daysSinceIssued,
          prior_late: clientHistoricalLateCount,
          avg_settlement: clientAverageDaysToPay,
          total_transactions: clientTotalInvoices,
        },
      }),
    });

    const data = await response.json();
    const prob = data.probabilities?.[1] ?? (clientHistoricalLateCount / Math.max(1, clientTotalInvoices) > 0.4 ? 0.78 : 0.22);
    const delay = data.regression_prediction ?? Math.round(clientAverageDaysToPay * 1.3);

    return {
      lateProbability: Number(prob.toFixed(2)),
      predictedDelayDays: Math.max(0, Math.round(delay)),
      riskTier: prob > 0.75 ? 'CRITICAL' : prob > 0.5 ? 'HIGH' : prob > 0.25 ? 'MEDIUM' : 'LOW',
    };
  },
});

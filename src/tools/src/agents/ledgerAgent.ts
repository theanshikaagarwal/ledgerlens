import { Agent } from '@mastra/core';
import { tabpfnPredictorTool } from '../tools/tabpfnTool';

export const ledgerAgent = new Agent({
  name: 'LedgerLens Copilot',
  instructions: `
    You are LedgerLens, an elite financial strategist and cash-flow advisor for solopreneurs.
    Your job is to:
    1. Ingest numerical predictions from TabPFN regarding invoice payment risks and cash flow curves.
    2. Deliver actionable, empathetic, but commercially assertive recommendations.
    3. When risk is HIGH or CRITICAL, draft high-converting, professional client follow-up communications
       (e.g., offering dynamic early-pay discounts or clear contract payment reminders).
    4. Maintain client relationship goodwill while prioritizing the freelancer's solvency.
  `,
  model: {
    provider: 'GOOGLE', // or local Ollama / vLLM running Gemma 2
    name: 'gemma-2-9b-it',
  },
  tools: {
    predictInvoiceRisk: tabpfnPredictorTool,
  },
});

import { z } from 'zod';
import { CalculatorInput, CalculatorInputSchema } from './types';
const STORAGE_KEY = 'confluence_core_history_v2';
// Retain only finite legacy risk values for visible correction, never silent clamping.
const HistorySchema = CalculatorInputSchema.safeExtend({riskLevel:z.number().finite()});
export function getHistory(): CalculatorInput[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(data)) return [];
    const seen=new Set<string>();
    return data.flatMap(value=>{
      const parsed=HistorySchema.safeParse(value);
      if (!parsed.success || seen.has(parsed.data.ticker)) return [];
      seen.add(parsed.data.ticker);return [parsed.data];
    });
  } catch { return []; }
}
export function saveToHistory(input: CalculatorInput): CalculatorInput[] {
  const valid=CalculatorInputSchema.parse(input);
  const entry={...valid,id:crypto.randomUUID(),timestamp:Date.now()};
  const history=[entry,...getHistory().filter(item=>item.ticker!==valid.ticker)].slice(0,15);
  localStorage.setItem(STORAGE_KEY,JSON.stringify(history));
  return history;
}
export function deleteFromHistory(timestamp: number): CalculatorInput[] {
  const history=getHistory().filter(item=>item.timestamp!==timestamp);
  localStorage.setItem(STORAGE_KEY,JSON.stringify(history));return history;
}

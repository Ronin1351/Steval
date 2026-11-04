import { z } from 'zod';

export const CalculatorInputSchema = z.object({
  id: z.string().optional(),
  ticker: z.string().trim().min(1, 'Ticker required').transform(value => value.toUpperCase()),
  currentPrice: z.number().min(0.0001, 'Must be > 0'),
  cloudMax: z.number().min(0.0001, 'Must be > 0'),
  cloudMin: z.number().min(0.0001, 'Must be > 0'),
  kijunSen: z.number().min(0.0001, 'Must be > 0'),
  nextHvnResistance: z.number().min(0.0001, 'Must be > 0'),
  adx: z.number().min(0).max(100),
  rsi: z.number().min(0).max(100),
  atr: z.number().min(0.0001, 'Must be > 0'),
  adxRising: z.boolean(),
  aboveSupportHvn: z.boolean(),
  above200Ema: z.boolean(),
  rvolConfirmed: z.boolean(),
  chochBullish: z.boolean(),
  chochFresh: z.boolean(),
  bosEnabled: z.boolean(),
  bosBullish: z.boolean(),
  allowRiskOverride: z.boolean().default(false),
  totalCash: z.number().min(0.01, 'Must be > 0'),
  riskLevel: z.number().min(0.5, 'Risk must be 0.5–5%').max(5, 'Risk must be 0.5–5%').refine(value => Math.abs(value * 10 - Math.round(value * 10)) < 1e-8, 'Use 0.1% steps'),
  timestamp: z.number().optional(),
}).refine(value => value.cloudMin <= value.cloudMax, { path: ['cloudMin'], message: 'Cloud Min must not exceed Cloud Max' });

export type CalculatorInput = z.infer<typeof CalculatorInputSchema>;

export type AppState = "INVALID_INPUT" | "NO_BREAKOUT" | "WARNING_OVEREXTENDED" | "GREEN_LIGHT_LONG" | "AMBER_LIGHT_LONG" | "HARD_GATE_OVERRIDE" | "WARNING_POOR_RPR" | "WARNING_BEAR_WALL" | "WARNING_NO_CHOCH" | "WARNING_NO_SMC_BOS" | "SOFT_CONFIRMATION_WEAK" | "WARNING_CHOP_TRAP" | "NEUTRAL_CONSOLIDATION";

export interface Diagnostics {
  minAdx: number;
  minRpr: number;
  maxRsi: number;
  actualRisk: number;
  capitalLimited: boolean;
  distanceToKijunPct: number;
  runwayPct: number;
  rpr: number;
  stopPrice: number;
  stopDistance: number;
  riskAmount: number;
  sharesToBuy: number;
  totalCapitalAlloc: number;
  suggestedEntry: number;
  nextHvnResistance: number;
  rprComponentStatus?: {
    isStopTooWide: boolean;
    isTargetTooClose: boolean;
    stopPctOfRunway: number;
  };
}

import { AppState, CalculatorInput, CalculatorInputSchema, Diagnostics } from './types';

export function analyzeTrade(input: CalculatorInput): { state: AppState; diag: Diagnostics; score: number | null; maxScore: number; failureReasons: string[] } {
  const maxScore = input.bosEnabled ? 9 : 8;
  const minAdx = input.allowRiskOverride ? 0 : 20;
  const minRpr = input.allowRiskOverride ? 1 : 1.5;
  const maxRsi = input.allowRiskOverride ? 80 : 70;
  const empty: Diagnostics = { minAdx, minRpr, maxRsi, actualRisk: 0, capitalLimited: false, distanceToKijunPct: 0, runwayPct: 0, rpr: 0, stopPrice: 0, stopDistance: 0, riskAmount: 0, sharesToBuy: 0, totalCapitalAlloc: 0, suggestedEntry: 0, nextHvnResistance: 0 };
  const parsed = CalculatorInputSchema.safeParse(input);
  if (!parsed.success) {
    return { state: 'INVALID_INPUT', diag: empty, score: null, maxScore, failureReasons: parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`) };
  }
  const { currentPrice: C, cloudMax, kijunSen, adx, rsi, atr, nextHvnResistance: target } = parsed.data;
  const stopDistance = 1.5 * atr;
  if (!Number.isFinite(stopDistance) || stopDistance >= C) {
    return { state: 'INVALID_INPUT', diag: empty, score: null, maxScore, failureReasons: ['Volatility stop distance must be positive and below entry price.'] };
  }
  const runway = target - C;
  const rpr = runway / stopDistance;
  const diag: Diagnostics = { ...empty, distanceToKijunPct: (C-kijunSen)/kijunSen*100, runwayPct: runway/C*100, rpr, stopPrice: C-stopDistance, stopDistance, suggestedEntry: C, nextHvnResistance: target };
  const reasons: string[] = [];
  if (C <= cloudMax) reasons.push('Price has not broken out above Cloud Max; a strict breakout is required.');
  if (rsi >= maxRsi) reasons.push(`RSI is ${rsi} (Limit: < ${maxRsi}).`);
  if (!input.above200Ema) reasons.push('Price is below the Institutional 200 EMA.');
  if (runway <= 0) reasons.push('Next HVN resistance is at or below current price.');
  if (rpr < minRpr) reasons.push(`Risk/Reward (RPR) is less than ${minRpr}. Current RPR is ${rpr.toFixed(2)}.`);
  if (adx <= minAdx) reasons.push(`ADX is ${adx} (Limit: > ${minAdx}).`);
  if (rpr < minRpr && runway > 0) {
    const isStopTooWide = stopDistance/C > .08;
    diag.rprComponentStatus = { isStopTooWide, isTargetTooClose: !isStopTooWide, stopPctOfRunway: stopDistance/runway*100 };
  }
  const result = (state: AppState, score: number | null = null) => ({ state, diag, score, maxScore, failureReasons: reasons });
  // Approved precedence and existing strict/inclusive comparisons.
  if (C <= cloudMax) return result('NO_BREAKOUT');
  if (rsi >= maxRsi) return result('WARNING_OVEREXTENDED');
  if (!input.above200Ema) return result('WARNING_BEAR_WALL');
  if (rpr < minRpr) return result('WARNING_POOR_RPR');
  if (adx <= minAdx) return result('WARNING_CHOP_TRAP');

  const score = (input.chochBullish ? 2 : 0) + (input.rvolConfirmed ? 2 : 0) + (input.bosEnabled && input.bosBullish ? 1 : 0) + (input.chochBullish && input.chochFresh ? 1 : 0) + (input.adxRising ? 1 : 0) + (input.aboveSupportHvn ? 1 : 0) + (rsi > 40 && rsi < 70 ? 1 : 0);
  if (!input.chochBullish) reasons.push('Missing Bullish CHoCH (Smart Money Initiation).');
  if (input.bosEnabled && !input.bosBullish) reasons.push('Include BOS is enabled but BOS is not confirmed.');
  if (!input.rvolConfirmed) reasons.push('Breakout volume is not above average.');
  if (!input.adxRising) reasons.push('ADX is not rising.');
  if (!input.aboveSupportHvn) reasons.push('Not above Major Support HVN.');
  if (!(rsi > 40 && rsi < 70)) reasons.push('RSI is outside the healthy momentum zone (40–70).');
  if (input.chochBullish && !input.chochFresh) reasons.push('CHoCH did not print within the last 5 bars.');
  if (!input.chochBullish) return result('WARNING_NO_CHOCH', score);
  if (input.bosEnabled && !input.bosBullish) return result('WARNING_NO_SMC_BOS', score);
  const green = score / maxScore >= .75;
  const amber = score / maxScore >= .5;
  const usesOverride = !!input.allowRiskOverride && (rsi >= 70 || adx <= 20 || rpr < 1.5);
  if (!amber || (usesOverride && !green)) {
    if (usesOverride) reasons.push('Structural override requires GREEN confirmation; partial confirmation remains blocked.');
    return result('SOFT_CONFIRMATION_WEAK', score);
  }
  const riskBudget = input.totalCash * input.riskLevel / 100 * (usesOverride ? .5 : 1);
  const riskShares = Math.floor(riskBudget / stopDistance);
  const cashShares = Math.floor(input.totalCash / C);
  diag.riskAmount = riskBudget;
  diag.sharesToBuy = Math.min(riskShares, cashShares);
  diag.capitalLimited = cashShares < riskShares;
  diag.totalCapitalAlloc = diag.sharesToBuy * C;
  diag.actualRisk = diag.sharesToBuy * stopDistance;
  if (!diag.sharesToBuy) reasons.push('Budget cannot fund one whole share at this entry and stop. No executable position.');
  return result(usesOverride ? 'HARD_GATE_OVERRIDE' : green ? 'GREEN_LIGHT_LONG' : 'AMBER_LIGHT_LONG', score);
}

import { Transaction } from '../types';

/**
 * Parses tax input (either fixed amount like "100000", "100.000", "Rp 100.000",
 * or percentage like "5%", "1.5%", "11%", "12%") into actual numeric Rupiah amount.
 */
export function parseTaxAmount(taxInput: string | number | undefined, baseAmount: number): number {
  if (taxInput === undefined || taxInput === null) return 0;
  
  if (typeof taxInput === 'number') {
    if (isNaN(taxInput) || taxInput <= 0) return 0;
    // If small number and base is large, might be percentage
    if (taxInput <= 30 && baseAmount >= 50000) {
      return Math.round((baseAmount * taxInput) / 100);
    }
    return taxInput;
  }

  const str = String(taxInput).trim();
  if (!str || str === '-' || str === '0' || str.toLowerCase() === 'nihil' || str.toLowerCase() === 'non') {
    return 0;
  }

  // 1. Percentage input: e.g. "5%", "1.5%", "1,5%", "11%", "12%", "15%"
  if (str.includes('%')) {
    const numPart = str.replace('%', '').replace(/\s+/g, '').replace(',', '.');
    const percent = parseFloat(numPart);
    if (!isNaN(percent) && percent > 0 && baseAmount > 0) {
      return Math.round((baseAmount * percent) / 100);
    }
    return 0;
  }

  // 2. Fixed Rupiah nominal: e.g. "100000", "100.000", "Rp 100.000", "100,000", "1.500.000"
  // Remove "Rp", whitespace
  let clean = str.replace(/rp\.?/gi, '').replace(/\s+/g, '');
  
  // Handle dot or comma thousands separators
  const dotCount = (clean.match(/\./g) || []).length;
  const commaCount = (clean.match(/,/g) || []).length;

  if (dotCount > 0 && commaCount === 0) {
    // Indonesian format: "100.000" or "1.500.000"
    clean = clean.replace(/\./g, '');
  } else if (commaCount > 0 && dotCount === 0) {
    // US format or comma separator: "100,000"
    clean = clean.replace(/,/g, '');
  } else if (dotCount > 0 && commaCount > 0) {
    // "100.000,00" -> remove dots, discard decimal cents
    clean = clean.split(',')[0].replace(/\./g, '');
  }

  const numVal = parseFloat(clean);
  if (!isNaN(numVal) && numVal > 0) {
    // If user typed e.g. "5" (meaning 5%) on a large transaction
    if (numVal <= 30 && baseAmount >= 50000) {
      return Math.round((baseAmount * numVal) / 100);
    }
    return numVal;
  }

  return 0;
}

/**
 * Formats tax string for clean, professional display in tables and documents.
 * E.g., "100000" -> "100.000", "5%" -> "5%", "-" -> "-"
 */
export function formatTaxDisplay(taxInput: string | number | undefined): string {
  if (taxInput === undefined || taxInput === null) return '-';
  const str = String(taxInput).trim();
  if (!str || str === '-' || str === '0' || str.toLowerCase() === 'nihil') return '-';
  
  if (str.includes('%')) return str;

  // Check if it's purely numeric
  const clean = str.replace(/rp\.?/gi, '').replace(/\s+/g, '').replace(/\./g, '').replace(/,/g, '');
  const num = parseFloat(clean);
  if (!isNaN(num) && num > 0) {
    if (num <= 30 && !str.includes('000')) {
      return `${num}%`;
    }
    return num.toLocaleString('id-ID');
  }

  return str;
}

/**
 * Calculates effective Netto for a transaction item.
 * Formula: Effective Netto = Max(0, Base Nominal - PPh - PPN)
 */
export function calculateEffectiveNetto(item: { netto?: number; pph?: string; ppn?: string }): number {
  const base = Number(item.netto) || 0;
  if (base <= 0) return 0;
  
  const pphAmount = parseTaxAmount(item.pph, base);
  const ppnAmount = parseTaxAmount(item.ppn, base);
  
  const effective = base - pphAmount - ppnAmount;
  return effective > 0 ? effective : 0;
}

/**
 * Calculates full tax and netto breakdown from a given Bruto base and tax inputs.
 */
export function calculateTaxBreakdown(
  brutoAmount: number,
  pphInput: string | number | undefined,
  ppnInput: string | number | undefined
) {
  const bruto = Math.max(0, Number(brutoAmount) || 0);
  const pphAmount = parseTaxAmount(pphInput, bruto);
  const ppnAmount = parseTaxAmount(ppnInput, bruto);
  const netto = Math.max(0, bruto - pphAmount - ppnAmount);

  return {
    bruto,
    pphAmount,
    ppnAmount,
    netto,
    pphDisplay: formatTaxDisplay(pphInput),
    ppnDisplay: formatTaxDisplay(ppnInput),
  };
}

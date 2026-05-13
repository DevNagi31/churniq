export const fmtN = (n: number, digits = 0): string =>
  n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const fmtCurrency = (n: number): string =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

export const fmtPct = (v: number | null | undefined, digits = 1): string => {
  if (v == null || Number.isNaN(v)) return '—';
  return `${(v * 100).toFixed(digits)}%`;
};

export const fmtRetention = (v: number | null): string => {
  if (v == null) return '—';
  return `${Math.round(v * 100)}%`;
};

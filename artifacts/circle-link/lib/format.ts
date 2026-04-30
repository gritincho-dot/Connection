const SUFFIXES = [
  "",
  "K",
  "M",
  "B",
  "T",
  "Qa",
  "Qi",
  "Sx",
  "Sp",
  "Oc",
  "No",
  "Dc",
];

export function formatNum(n: number): string {
  if (!isFinite(n)) return "∞";
  if (n < 0) return "-" + formatNum(-n);
  if (n < 1) return n.toFixed(2);
  if (n < 1000) return Math.floor(n * 10) / 10 < n ? n.toFixed(1) : n.toFixed(0);

  let tier = Math.floor(Math.log10(n) / 3);
  if (tier >= SUFFIXES.length) tier = SUFFIXES.length - 1;
  const scaled = n / Math.pow(1000, tier);
  const suffix = SUFFIXES[tier];
  return `${scaled.toFixed(scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2)}${suffix}`;
}

export function formatInt(n: number): string {
  if (!isFinite(n)) return "∞";
  if (n < 1000) return Math.floor(n).toString();
  return formatNum(n);
}

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
  if (n === 0) return "0";
  if (n < 1) return n.toFixed(2);
  if (n < 1000) return Math.floor(n * 10) / 10 < n ? n.toFixed(1) : n.toFixed(0);

  const exp = Math.floor(Math.log10(n));

  if (exp >= 100) {
    const mantissa = n / Math.pow(10, exp);
    return `${mantissa.toFixed(2)}e+${exp}`;
  }

  if (exp >= 33) {
    const mantissa = n / Math.pow(10, exp);
    return `${mantissa.toFixed(2)}e+${exp}`;
  }

  let tier = Math.floor(exp / 3);
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

export function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

// dd/mm/aaaa en UTC: igual en servidor y cliente (sin riesgo de hidratación).
export function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

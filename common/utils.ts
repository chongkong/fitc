export function setEquals<T>(a1: T[], a2: T[]) {
  const s1 = new Set(a1);
  const s2 = new Set(a2);
  return s1.size == s2.size && a1.every(elem => s2.has(elem));
}

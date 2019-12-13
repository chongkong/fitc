// Utility type for enforcing Required on provided keys,
// and Partial on keys not provided.
export type RequirePartial<T, K extends keyof T> = Required<Pick<T, K>> &
  Partial<Omit<T, K>>;

export function setEquals<T>(a1: T[], a2: T[]) {
  const s1 = new Set(a1);
  const s2 = new Set(a2);
  return s1.size === s2.size && a1.every(elem => s2.has(elem));
}

export function groupByLdap<T extends { ldap: string }>(
  elems: T[]
): { [ldap: string]: T } {
  return elems.reduce(
    (dict, elem) => Object.assign(dict, { [elem.ldap]: elem }),
    {}
  );
}

export namespace Arrays {
  export function range(from: number, to?: number, stride?: number) {
    const arr = [];
    if (to === undefined) {
      to = from;
      from = 0;
      stride = 1;
    } else if (stride === undefined) {
      stride = 1;
    }
    for (let item = from; item < to; item += stride) {
      arr.push(item);
    }
    return arr;
  }

  export function repeat(item: any, count: number) {
    if (count < 0) {
      throw new Error("Invalid argument");
    }
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push(item);
    }
    return arr;
  }

  export function cartesian<T, U>(as: T[], bs: U[]): [T, U][];
  export function cartesian<T, U, V>(as: T[], bs: U[], cs: V[]): [T, U, V][];
  export function cartesian<T, U, V, W>(
    as: T[],
    bs: U[],
    cs: V[],
    ds: W[]
  ): [T, U, V, W][];
  export function cartesian<T, U, V, W>(as: T[], bs?: U[], cs?: V[], ds?: W[]) {
    return ds
      ? as!.flatMap(a =>
          bs!.flatMap(b => cs!.flatMap(c => ds.map(d => [a, b, c, d])))
        )
      : cs
      ? as!.flatMap(a => bs!.flatMap(b => cs.map(c => [a, b, c])))
      : bs
      ? as!.flatMap(a => bs.map(b => [a, b]))
      : as;
  }
}

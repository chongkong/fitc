export function setEquals<T>(a1: T[], a2: T[]) {
  const s1 = new Set(a1);
  const s2 = new Set(a2);
  return s1.size === s2.size && a1.every(elem => s2.has(elem));
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
}

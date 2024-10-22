import { setEquals, Arrays } from "./utils";

describe("setEquals", () => {
  test("Returns true", () => {
    expect(setEquals([], [])).toBeTruthy();
    expect(setEquals(["a"], ["a"])).toBeTruthy();
    expect(setEquals(["a", "b"], ["b", "a"])).toBeTruthy();
    expect(setEquals(["a", "a", "b"], ["a", "b", "b"])).toBeTruthy();
  });

  test("Returns false", () => {
    expect(setEquals(["a"], ["b"])).toBeFalsy();
    expect(setEquals(["a", "b"], ["b"])).toBeFalsy();
    expect(setEquals(["a"], ["a", "b"])).toBeFalsy();
    expect(setEquals(["a", "b"], ["b", "c"])).toBeFalsy();
  });
});

describe("Arrays", () => {
  describe("range", () => {
    test("One argument (0, to)", () => {
      expect(Arrays.range(5)).toStrictEqual([0, 1, 2, 3, 4]);
      expect(Arrays.range(0)).toStrictEqual([]);
    });

    test("Two arguments (from, to)", () => {
      expect(Arrays.range(3, 6)).toStrictEqual([3, 4, 5]);
      expect(Arrays.range(6, 3)).toStrictEqual([]);
    });

    test("Three arguments (from, to, stride)", () => {
      expect(Arrays.range(0, 10, 2)).toStrictEqual([0, 2, 4, 6, 8]);
      expect(Arrays.range(10, 0, 2)).toStrictEqual([]);
    });
  });

  describe("repeat", () => {
    test("Typical cases", () => {
      expect(Arrays.repeat("A", 3)).toStrictEqual(["A", "A", "A"]);
      expect(Arrays.repeat("A", 100).length).toBe(100);
    });
  });

  describe("cartesian", () => {
    test("Two arguments", () => {
      expect(Arrays.cartesian([], [])).toStrictEqual([]);
      expect(Arrays.cartesian([1], [])).toStrictEqual([]);
      expect(Arrays.cartesian([], ["a"])).toStrictEqual([]);
      expect(Arrays.cartesian([1], ["a"])).toStrictEqual([[1, "a"]]);
      expect(Arrays.cartesian([1, 2], ["a", "b"])).toStrictEqual([
        [1, "a"],
        [1, "b"],
        [2, "a"],
        [2, "b"]
      ]);
    });
    test("Three arguments", () => {
      expect(Arrays.cartesian([], [], [])).toStrictEqual([]);
      expect(Arrays.cartesian([1], [], [])).toStrictEqual([]);
      expect(Arrays.cartesian([], ["a"], [])).toStrictEqual([]);
      expect(Arrays.cartesian([], [], [true])).toStrictEqual([]);
      expect(Arrays.cartesian([1, 2], ["a", "b"], [true, false])).toStrictEqual(
        [
          [1, "a", true],
          [1, "a", false],
          [1, "b", true],
          [1, "b", false],
          [2, "a", true],
          [2, "a", false],
          [2, "b", true],
          [2, "b", false]
        ]
      );
    });

    test("Four arguments", () => {
      expect(
        Arrays.cartesian([1, 2], ["a", "b"], [true], [{}, null])
      ).toStrictEqual([
        [1, "a", true, {}],
        [1, "a", true, null],
        [1, "b", true, {}],
        [1, "b", true, null],
        [2, "a", true, {}],
        [2, "a", true, null],
        [2, "b", true, {}],
        [2, "b", true, null]
      ]);
    });
  });
});

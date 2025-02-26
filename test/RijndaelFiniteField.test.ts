import { RijndaelFiniteField } from "../src/utils/RijndaelFiniteField";

describe("RijndaelFiniteField Addition", () => {
  it("should perform XOR-based addition correctly", () => {
    const a = new RijndaelFiniteField(0b1100n); // 12
    const b = new RijndaelFiniteField(0b1010n); // 10

    const result = a.add(b);

    // XOR: 1100 ^ 1010 = 0110 (6 in decimal)
    expect(result.toBigInt()).toEqual(0b0110n);
  });

  it("should not change when adding zero", () => {
    const a = new RijndaelFiniteField(0b1011n); // 11
    const zero = new RijndaelFiniteField(0n);

    const result = a.add(zero);

    // 1011 ^ 0000 = 1011 (11 in decimal)
    expect(result.toBigInt()).toEqual(0b1011n);
  });

  it("should be commutative: a + b = b + a", () => {
    const a = new RijndaelFiniteField(0b1001n); // 9
    const b = new RijndaelFiniteField(0b0110n); // 6

    const result1 = a.add(b);
    const result2 = b.add(a);

    // XOR: 1001 ^ 0110 = 1111 (15 in decimal)
    expect(result1.toBigInt()).toEqual(0b1111n);
    expect(result2.toBigInt()).toEqual(0b1111n);
  });

  it("should be associative: (a + b) + c = a + (b + c)", () => {
    const a = new RijndaelFiniteField(0b1001n); // 9
    const b = new RijndaelFiniteField(0b0110n); // 6
    const c = new RijndaelFiniteField(0b0011n); // 3

    const left = a.add(b).add(c); // (a + b) + c
    const right = a.add(b.add(c)); // a + (b + c)

    expect(left.toBigInt()).toEqual(right.toBigInt());
  });

  it("should satisfy XOR identity property: a + a = 0", () => {
    const a = new RijndaelFiniteField(0b1110n); // 14

    const result = a.add(a);

    // XOR: 1110 ^ 1110 = 0000 (0 in decimal)
    expect(result.toBigInt()).toEqual(0n);
  });
});

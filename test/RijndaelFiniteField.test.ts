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

describe("RijndaelFiniteField Multiplication", () => {
  it("should perform multiplication correctly", () => {
    const a = new RijndaelFiniteField(0b1100n); // 12
    const b = new RijndaelFiniteField(0b1010n); // 10

    const result = a.mult(b);
    expect(Number(result.toBigInt())).toEqual(120);

    const c = new RijndaelFiniteField(0x1cn); // 28
    const d = new RijndaelFiniteField(0xffn); // 255
    expect(Number(c.mult(d).toBigInt())).toEqual(1);

    const e = new RijndaelFiniteField(0x0n);
    const f = new RijndaelFiniteField(0x1n);
    for (let i = 0; i < 256; i++) {
      const g = new RijndaelFiniteField(i);
      expect(Number(e.mult(g).toBigInt())).toEqual(0);
      expect(Number(f.mult(g).toBigInt())).toEqual(i);
    }
  });
  it("should perform single x multiplication correctly for non-high bit numbers", () => {
    const a = new RijndaelFiniteField(0b1100n); // 12

    const result = RijndaelFiniteField._multOne(a.toFields()[0]);
    expect(Number(result.toBigInt())).toEqual(24);

    const b = new RijndaelFiniteField(0b1010n); // 10
    const result2 = RijndaelFiniteField._multOne(b.toFields()[0]);
    expect(Number(result2.toBigInt())).toEqual(20);

    const c = new RijndaelFiniteField(0b1111000n); // 120
    const result3 = RijndaelFiniteField._multOne(c.toFields()[0]);
    expect(Number(result3.toBigInt())).toEqual(240);

    const d = new RijndaelFiniteField(0b0n); // 0
    const result4 = RijndaelFiniteField._multOne(d.toFields()[0]);
    expect(Number(result4.toBigInt())).toEqual(0);
  });

  it("should perform single x multiplication correctly for high bit numbers", () => {
    const a = new RijndaelFiniteField(0b10000000n); // 128

    const result = RijndaelFiniteField._multOne(a.toFields()[0]);
    expect(Number(result.toBigInt())).toEqual(27);

    const b = new RijndaelFiniteField(0b11000000n); // 192
    const result2 = RijndaelFiniteField._multOne(b.toFields()[0]);
    expect(Number(result2.toBigInt())).toEqual(155);

    const c = new RijndaelFiniteField(0b11000001n); // 193
    const result3 = RijndaelFiniteField._multOne(c.toFields()[0]);
    expect(Number(result3.toBigInt())).toEqual(153);
  });
});

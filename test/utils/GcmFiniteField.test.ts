import { GcmFiniteField } from "../../src/utils/GcmFiniteField";
import { Field } from "o1js";

describe("GcmFiniteField multiplication", () => {
  it("shiftRight1 divides by 2", () => {
    const a: GcmFiniteField = GcmFiniteField.fromTwoFields(
      Field(0n),
      Field(4n),
    );
    const result: GcmFiniteField = a.shiftRight1();
    expect(result.toFields()[1]).toEqual(Field(2n));
  });

  it("across the bridge", () => {
    const a: GcmFiniteField = GcmFiniteField.fromTwoFields(
      Field(1n),
      Field(0n),
    );
    const result: GcmFiniteField = a.shiftRight1();
    expect(result.toFields()[1]).toEqual(Field(0x8000000000000000n));
  });
});
describe("GcmFiniteField multiplication", () => {
  it("should not change when multiplying 1", () => {
    const a: GcmFiniteField = GcmFiniteField.fromTwoFields(
      Field(12n),
      Field(11n),
    );
    // the id elem is where the the MSB is 1
    const zero = GcmFiniteField.fromTwoFields(
      Field(0x8000000000000000n),
      Field(0n),
    );
    const result: GcmFiniteField = GcmFiniteField.mul(a, zero);

    expect(result.toFields()[0]).toEqual(Field(12n));
    expect(result.toFields()[1]).toEqual(Field(11n));
  });

  it("should be commutative: a * b = b * a", () => {
    const a = GcmFiniteField.fromTwoFields(
      Field(0x8000000000000000n),
      Field(1n),
    );
    const b = GcmFiniteField.fromTwoFields(
      Field(0x8000000000000000n),
      Field(0n),
    );

    const result1 = GcmFiniteField.mul(a, b);
    const result2 = GcmFiniteField.mul(b, a);

    expect(result1.toFields()[0]).toEqual(result2.toFields()[0]);
    expect(result1.toFields()[1]).toEqual(result2.toFields()[1]);
  });

  it("should be associative: (a + b) + c = a + (b + c)", () => {
    const a = new GcmFiniteField(98234094275645n);
    const b = new GcmFiniteField(12348769918724n);
    const c = new GcmFiniteField(90009812748623n);

    const left = GcmFiniteField.mul(GcmFiniteField.mul(a, b), c); // (a + b) + c
    const right = GcmFiniteField.mul(a, GcmFiniteField.mul(b, c)); // a + (b + c)

    expect(left).toEqual(right);
  });
});

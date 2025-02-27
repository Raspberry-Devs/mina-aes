import { createForeignField, Field, Gadgets, Provable } from "o1js";
import { inv_box } from "./RijndaelConstants.js";
import { BYTE_SIZE, RIJNDAEL_FINITE_SIZE } from "./constants.js";

class RijndaelFiniteField extends createForeignField(RIJNDAEL_FINITE_SIZE) {
  static fromField(field: Field): RijndaelFiniteField {
    return new RijndaelFiniteField([field, Field(0n), Field(0n)]);
  }
  // Override the multiplication method
  mult(other: RijndaelFiniteField): RijndaelFiniteField {
    // Convert the fields to Bits
    const aField = this.toFields()[0];
    const bField = other.toFields()[0];

    let cField = Field(0n);

    // Naive implementation of multiplication which is O(n^2)
    for (let i = 0; i < BYTE_SIZE; i++) {
      const isOne = Gadgets.and(
        Gadgets.rightShift64(bField, i),
        Field(1),
        1,
      ).assertBool("bShifted is not a boolean");
      let tempField = aField.mul(isOne.toField());
      for (let j = 0; j < i; j++) {
        tempField = RijndaelFiniteField._multOne(tempField);
      }
      cField = Gadgets.xor(cField, tempField, BYTE_SIZE);
    }

    return RijndaelFiniteField.fromField(cField);
  }

  static _multOne(a: Field): Field {
    // Check whether the high bit is set
    const highBitSet = Gadgets.and(
      Gadgets.rightShift64(a, BYTE_SIZE - 1),
      Field(1),
      1,
    );

    // Shift left by one
    const shifted = Gadgets.leftShift32(a, 1);
    // Save an AND gate by adding the high bit to the mask
    const mask = Field(0b100011011n).mul(highBitSet);

    // XOR with the mask, zeroes out high bit if it was set
    const result = Gadgets.xor(shifted, mask, BYTE_SIZE + 1);
    return result;
  }

  // Override the addition method
  add(other: RijndaelFiniteField): RijndaelFiniteField {
    // Addition in Rijndael's field is equivalent to bitwise XOR
    return RijndaelFiniteField.xor(this, other);
  }

  // Override the division method (finding the inverse and multiplying)
  div(other: RijndaelFiniteField): RijndaelFiniteField {
    return this.mult(other.inverse());
  }

  // Method for finding the inverse
  inverse(): RijndaelFiniteField {
    const inv = Provable.witness(Field, () => {
      const out = inv_box[Number(this.toFields()[0])];
      return Field(out);
    });

    const r_inv = RijndaelFiniteField.fromField(inv);

    // If inv is 0, then the inverse is 0, otherwise it is 1
    const isOne = inv.toFields()[0].equals(0).not();
    const compare = RijndaelFiniteField.fromField(isOne.toField());

    // Add constraint that the inverse is correct
    r_inv.mult(this).assertEquals(compare);

    return r_inv;
  }

  static xor(
    a: RijndaelFiniteField,
    b: RijndaelFiniteField,
  ): RijndaelFiniteField {
    // This is a bitwise XOR operation
    // Fetch underlying fields
    const aField = a.toFields();
    const bField = b.toFields();

    // Perform XOR operation on field
    const out = Gadgets.xor(aField[0], bField[0], BYTE_SIZE);

    return RijndaelFiniteField.fromField(out);
  }
}

function affineTransform(a: RijndaelFiniteField) {
  const a_inv_bits = a
    .inverse()
    .toFields()[0]
    .toBits()
    .map((bit) => bit.toField());

  const c = Field(0x63)
    .toBits()
    .map((bit) => bit.toField());
  let res = Field(0);

  for (let i = 0; i < BYTE_SIZE; i++) {
    let bit = a_inv_bits[i];
    bit = Gadgets.xor(bit, a_inv_bits[(i + 4) % BYTE_SIZE], 1);
    bit = Gadgets.xor(bit, a_inv_bits[(i + 5) % BYTE_SIZE], 1);
    bit = Gadgets.xor(bit, a_inv_bits[(i + 6) % BYTE_SIZE], 1);
    bit = Gadgets.xor(bit, a_inv_bits[(i + 7) % BYTE_SIZE], 1);
    bit = Gadgets.xor(bit, c[i], 1);

    res = Gadgets.or(res, Gadgets.leftShift32(bit, i), BYTE_SIZE);
  }

  return res;
}

export { RijndaelFiniteField, affineTransform };

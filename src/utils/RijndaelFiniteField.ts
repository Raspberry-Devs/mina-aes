import { createForeignField, Field, Gadgets } from "o1js";
import { Field3 } from "o1js/dist/node/lib/provable/gadgets/foreign-field";

const RIJNDAEL_FINITE_SIZE = 256n;
const BYTE_SIZE = 8;

class RijndaelFiniteField extends createForeignField(RIJNDAEL_FINITE_SIZE) {
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

    return new RijndaelFiniteField([cField, Field(0n), Field(0n)]);
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
    const mask = Field(0b11011n).mul(highBitSet);

    // If the high bit is set, then we need to XOR with the mask
    // Additionally reduce result size to 8 bits
    const result = Gadgets.and(
      Gadgets.xor(shifted, mask, BYTE_SIZE),
      Field(255n),
      BYTE_SIZE,
    );
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
    // ...implementation...
    return new RijndaelFiniteField(0n);
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

    // Convert into Field3
    const cField: Field3 = [out, Field(0), Field(0)];

    return new RijndaelFiniteField(cField);
  }
}

export { RijndaelFiniteField };

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
    let bField = other.toFields()[0];

    let cField = Field(0n);

    let tempA = aField;
    for (let i = 0; i < BYTE_SIZE; i++) {
      // Check the least-significant bit of bField.
      const lsb = Gadgets.and(bField, Field(1), 1);
      // If the bit is 1, add the current tempA (multiplicand shifted by i)
      // to the result using XOR (addition in GF(2^8)).
      cField = Gadgets.xor(cField, tempA.mul(lsb), BYTE_SIZE);

      // Multiply tempA by x (i.e. perform RijndaelFiniteField._multOne) for next bit.
      tempA = RijndaelFiniteField._multOne(tempA);
      // Right shift bField by 1 to process the next bit.
      bField = Gadgets.rightShift64(bField, 1);
    }

    return RijndaelFiniteField.fromField(cField);
  }

  // Helper method for multiplying by x
  static _multOne(a: Field): Field {
    // Check whether the high bit is set
    const highBitSet = Gadgets.and(
      Gadgets.rightShift64(a, BYTE_SIZE - 1),
      Field(1),
      1,
    );

    // Shift left by one
    const shifted = a.mul(2);
    // Save an AND gate by adding the high bit to the mask
    const mask = Field(0b100011011).mul(highBitSet);

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

    // Add constraint that the inverse is correct
    r_inv.mult(this).toFields()[0].assertEquals(isOne.toField());

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

function byteToBits(a: Field): Field[] {
  return Array.from({ length: BYTE_SIZE }, (_, i) => {
    return Gadgets.and(Gadgets.rightShift64(a, i), Field(1), 1);
  });
}

function affineTransform(a: RijndaelFiniteField) {
  const a_inv_bits = byteToBits(a.inverse().toFields()[0]);

  const c = byteToBits(Field(0x63));
  let res = Field(0);

  for (let i = 0; i < BYTE_SIZE; i++) {
    let bit = a_inv_bits[i];
    bit = bit.add(a_inv_bits[(i + 4) % BYTE_SIZE]);
    bit = bit.add(a_inv_bits[(i + 5) % BYTE_SIZE]);
    bit = bit.add(a_inv_bits[(i + 6) % BYTE_SIZE]);
    bit = bit.add(a_inv_bits[(i + 7) % BYTE_SIZE]);
    bit = bit.add(c[i]);

    bit = Gadgets.and(bit, Field(1), 1);

    res = res.add(bit.mul(2 ** i));
  }

  return res;
}

export { RijndaelFiniteField, affineTransform };

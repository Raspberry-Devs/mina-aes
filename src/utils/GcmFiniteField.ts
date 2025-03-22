import { createForeignField, Field, Gadgets, Provable } from "o1js";
import { GCM_FINITE_SIZE } from "./constants.js";

/**
 * A Finite Field which implements {@link https://en.wikipedia.org/wiki/Finite_field_arithmetic#Gcm's_(AES)_finite_field Rijndael's Finite Field} operations.
 * Operates on values less than 256 and is used to generate sbox values on the fly
 * Its most important for providing non-linearity within the AES encryption scheme
 */
class GcmFiniteField extends createForeignField(GCM_FINITE_SIZE) {
  /**
   * Wrap field into GcmFiniteField, note that field should be less than 256
   * @param {Field} field Input field to wrap
   * @returns {GcmFiniteField}
   */
  static fromTwoFields(top: Field, bot: Field): GcmFiniteField {
    return new GcmFiniteField([top, bot, Field(0n)]);
  }

  shiftRight1(): GcmFiniteField {
    const top = this.toFields()[0];
    let bot = this.toFields()[1];
    const rShiftBot = Gadgets.rightShift64(bot, 1);
    bot = Provable.if(
      Gadgets.and(top, Field(1), 64).equals(Field(1)),
      Gadgets.and(Field(BigInt(0x8000000000000000)), rShiftBot, 64),
      rShiftBot,
    );
    return GcmFiniteField.fromTwoFields(Gadgets.rightShift64(top, 1), bot);
  }
  /**
   * Perform mult operation in GF(2^128).
   * Specifically, this field is interpreted as a polynomial in GF(2). Each bit represents a coefficients.
   * See {@link https://csrc.nist.rip/groups/ST/toolkit/BCM/documents/proposedmodes/gcm/gcm-revised-spec.pdf Galois Counter Mode}
   * @param x First Byte struct.
   * @param y Second Byte struct.
   * @returns A new Byte struct representing the XOR result.
   */
  static mul(x: GcmFiniteField, y: GcmFiniteField): GcmFiniteField {
    // Apparently this is a particular polynomial GCM uses
    const R: GcmFiniteField = GcmFiniteField.fromTwoFields(
      Field(0xe100000000000000),
      Field(0),
    );
    let z = GcmFiniteField.fromTwoFields(Field(0), Field(0));
    let v = x;
    const yTop = y.toFields()[0];
    const yBot = y.toFields()[1];
    for (let i = 0; i < 64; ++i) {
      z = Provable.if(
        Gadgets.and(
          Field(1),
          Gadgets.rightShift64(yTop, 64 - i - 1),
          64,
        ).equals(Field(1)),
        GcmFiniteField.xor(z, v),
        z,
      );
      const rshV = v.shiftRight1();
      const vBot = v.toFields()[1];
      v = Provable.if(
        Gadgets.and(Field(1), vBot, 64).equals(Field(1)),
        rshV,
        GcmFiniteField.xor(rshV, R),
      );
    }
    for (let i = 0; i < 64; ++i) {
      // Only difference from above is use y.bot instead of y.top
      z = Provable.if(
        Gadgets.and(
          Field(1),
          Gadgets.rightShift64(yBot, 64 - i - 1),
          64,
        ).equals(Field(1)),
        GcmFiniteField.xor(z, v),
        z,
      );
      const rshV = v.shiftRight1();
      const vBot = v.toFields()[1];
      v = Provable.if(
        Gadgets.and(Field(1), vBot, 64).equals(Field(1)),
        rshV,
        GcmFiniteField.xor(rshV, R),
      );
    }
    return z;
  }
  // /**
  //  * Multiply a Gcm number by x (represented as 2 in the field)
  //  * @param {Field} a
  //  * @returns {Field}
  //  */
  // static _multOne(a: Field): Field {
  //   // Check whether the high bit is set
  //   const highBitSet = Gadgets.and(
  //     Gadgets.rightShift64(a, BYTE_SIZE - 1),
  //     Field(1),
  //     1,
  //   );

  //   // Shift left by one
  //   const shifted = a.mul(2);
  //   // Save an AND gate by adding the high bit to the mask
  //   const mask = Field(0b100011011).mul(highBitSet);

  //   // XOR with the mask, zeroes out high bit if it was set
  //   const result = Gadgets.xor(shifted, mask, BYTE_SIZE + 1);
  //   return result;
  // }

  // /**
  //  * Add two Gcm numbers together, this is equivalent to an xor operation
  //  * @param {GcmFiniteField} other
  //  * @returns {GcmFiniteField}
  //  */
  // add(other: GcmFiniteField): GcmFiniteField {
  //   // Addition in Gcm's field is equivalent to bitwise XOR
  //   return GcmFiniteField.xor(this, other);
  // }

  // /**
  //  * Computes the inverse of the current value, the inverse always satisifes the relationship p * (p^-1) = 1
  //  * @returns {GcmFiniteField}
  //  */
  // inverse(): GcmFiniteField {
  //   const inv = Provable.witness(Field, () => {
  //     const out = inv_box[Number(this.toFields()[0])];
  //     return Field(out);
  //   });

  //   const r_inv = GcmFiniteField.fromField(inv);

  //   // If inv is 0, then the inverse is 0, otherwise it is 1
  //   const isOne = inv.toFields()[0].equals(0).not();

  //   // Add constraint that the inverse is correct
  //   r_inv.mult(this).toFields()[0].assertEquals(isOne.toField());

  //   return r_inv;
  // }

  /**
   * Performs bitwise xor used in Gcm addition
   * @param a first input
   * @param b second input
   * @returns {GcmFiniteField} resulting xor result
   */
  static xor(a: GcmFiniteField, b: GcmFiniteField): GcmFiniteField {
    // This is a bitwise XOR operation
    // Fetch underlying fields
    const aField = a.toFields();
    const bField = b.toFields();

    // Perform XOR operation on field
    const top = Gadgets.xor(aField[0], bField[0], 64);
    const bot = Gadgets.xor(aField[1], bField[1], 64);

    return GcmFiniteField.fromTwoFields(top, bot);
  }
}

export { GcmFiniteField };

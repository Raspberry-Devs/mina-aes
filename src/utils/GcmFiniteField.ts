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

  // shiftRight1(): GcmFiniteField {
  //   const top = this.toFields()[0];
  //   let bot = this.toFields()[1];
  //   const rShiftBot = Gadgets.rightShift64(bot, 1);
  //   bot = Provable.if(
  //     Gadgets.and(top, Field(1), 64).equals(Field(1)),
  //     Gadgets.and(Field(BigInt(0x8000000000000000)), rShiftBot, 64),
  //     rShiftBot,
  //   );
  //   return GcmFiniteField.fromTwoFields(Gadgets.rightShift64(top, 1), bot);
  // }
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
        GcmFiniteField,
        GcmFiniteField.xor(z, v),
        z,
      );
      //--------- shiftRight1 start---------------
      // const rshV = v.shiftRight1();
      const top = v.toFields()[0];
      let bot = v.toFields()[1];
      const rShiftBot = Gadgets.rightShift64(bot, 1);
      bot = Provable.if(
        Gadgets.and(top, Field(1), 64).equals(Field(1)),
        Gadgets.and(Field(BigInt(0x8000000000000000)), rShiftBot, 64),
        rShiftBot,
      );
      const rshV = GcmFiniteField.fromTwoFields(
        Gadgets.rightShift64(top, 1),
        bot,
      );
      //--------- shiftRight1 end---------------
      const vBot = v.toFields()[1];
      v = Provable.if(
        Gadgets.and(Field(1), vBot, 64).equals(Field(1)),
        GcmFiniteField,
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
        GcmFiniteField,
        GcmFiniteField.xor(z, v),
        z,
      );
      //--------- shiftRight1 start---------------
      // const rshV = v.shiftRight1();
      const top = v.toFields()[0];
      let bot = v.toFields()[1];
      const rShiftBot = Gadgets.rightShift64(bot, 1);
      bot = Provable.if(
        Gadgets.and(top, Field(1), 64).equals(Field(1)),
        Gadgets.and(Field(BigInt(0x8000000000000000)), rShiftBot, 64),
        rShiftBot,
      );
      const rshV = GcmFiniteField.fromTwoFields(
        Gadgets.rightShift64(top, 1),
        bot,
      );
      //--------- shiftRight1 end---------------
      const vBot = v.toFields()[1];
      v = Provable.if(
        Gadgets.and(Field(1), vBot, 64).equals(Field(1)),
        GcmFiniteField,
        rshV,
        GcmFiniteField.xor(rshV, R),
      );
    }
    return z;
  }

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

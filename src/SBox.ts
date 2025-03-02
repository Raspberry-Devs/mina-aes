import { Field, Gadgets } from "o1js";
import { Byte16 } from "./primitives/Bytes.js";
import { BYTE_SIZE } from "./utils/constants.js";
import {
  affineTransform,
  RijndaelFiniteField,
} from "./utils/RijndaelFiniteField.js";

/**
 * Takes in a 8-byte number represented as a field and returns the substituted output
 * Note that this code will return incorrect values for numbers larger than 8-bytes
 * @param {Field} input an 8-byte number represented within a field
 * @returns {Field} the substituted output
 */
function sbox(input: Field): Field {
  let output: Field = Field(0);

  for (let i = 0; i < 8; i++) {
    // Apply the S-box to each byte of the input
    const shifted = Gadgets.rightShift64(input, i * BYTE_SIZE);
    const byte = Gadgets.and(shifted, Field(0xff), BYTE_SIZE * BYTE_SIZE);

    const byte_sbox = sbox_byte(byte);
    output = output.add(byte_sbox.mul(Field(2 ** (i * BYTE_SIZE))));
  }

  return output;
}

/**
 * Takes in a byte represented as a field and returns the substituted output
 * Note that this code will return incorrect values for numbers larger than a byte
 * @param {Field} input a byte represented within a field
 * @returns {Field} the substituted output
 */
function sbox_byte(input: Field): Field {
  const byte = RijndaelFiniteField.fromField(input);
  const byte_sbox = affineTransform(byte);
  return byte_sbox;
}

/**
 * Performs a full sbox substitution on a 128-bit value represented within a Byte16 class
 * @param {Byte16} input the 128-bit value to substitute
 * @returns {Byte16} the substituted value
 */
function sbox_public(input: Byte16): Byte16 {
  const enc_top = sbox(input.left);
  const enc_bot = sbox(input.right);

  return new Byte16(enc_top, enc_bot);
}

export { sbox_public as sbox, sbox_byte };

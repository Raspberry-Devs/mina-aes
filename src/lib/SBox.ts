import { Field } from "o1js";
import { Byte16 } from "../primitives/Bytes.js";
import {
  affineTransform,
  RijndaelFiniteField,
} from "../utils/RijndaelFiniteField.js";

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
function sbox(input: Byte16): Byte16 {
  const cols = input.toColumns();
  const newCols: Field[][] = [];

  for (let i = 0; i < 4; i++) {
    const arr: Field[] = [];
    for (let j = 0; j < 4; j++) {
      arr.push(sbox_byte(cols[i][j]));
    }
    newCols.push(arr);
  }

  return Byte16.fromColumns(newCols);
}

export { sbox, sbox_byte };

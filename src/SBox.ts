import { Field, Gadgets } from "o1js";
import { Byte16 } from "./primitives/Bytes.js";
import { BYTE_SIZE } from "./utils/constants.js";
import {
  affineTransform,
  RijndaelFiniteField,
} from "./utils/RijndaelFiniteField.js";

function sbox(input: Field): Field {
  let output: Field = Field(0);

  for (let i = 0; i < 8; i++) {
    // Apply the S-box to each byte of the input
    const shifted = Gadgets.rightShift64(input, i * BYTE_SIZE);
    const byte = Gadgets.and(shifted, Field(0xff), BYTE_SIZE * BYTE_SIZE);

    const byte_sbox = sbox_byte(byte);
    output = Gadgets.or(
      Gadgets.leftShift64(byte_sbox, i * BYTE_SIZE),
      output,
      BYTE_SIZE * BYTE_SIZE,
    );
  }

  return output;
}

function sbox_byte(input: Field): Field {
  const byte = RijndaelFiniteField.fromField(input);
  const byte_sbox = affineTransform(byte);
  return byte_sbox;
}

function sbox_public(input: Byte16): Byte16 {
  const enc_top = sbox(input.top);
  const enc_bot = sbox(input.bot);

  return new Byte16(enc_top, enc_bot);
}

export { sbox_public as sbox, sbox_byte };

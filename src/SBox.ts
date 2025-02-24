import { Field, Gadgets, Provable, Struct } from "o1js";
import { Byte16 } from "./primitives/Bytes";
import { sbox_arr } from "./utils/SBoxArr";

class SBoxArr extends Struct({
  value: Provable.Array(Field, 256),
}) {}

function sbox(input: Field): Field {
  let output: Field = Field(0);

  const sbox = new SBoxArr({ value: sbox_arr });

  for (let i = 0; i < 8; i++) {
    // Apply the S-box to each byte of the input
    const shifted = Gadgets.rightShift64(input, i * 8);
    const byte = Gadgets.and(shifted, Field(0xff), 64);
    let byte_output = Field(0);

    for (let j = 0; j < 256; j++) {
      // This is either 0 or 1, depending on whether we have accessed the correct index
      //TODO: Use map for more efficiency?
      const correct_index = byte.equals(Field(j)).toField();

      byte_output = byte_output.add(sbox.value[j].mul(correct_index));
    }
    // Transform byte_output to the correct position
    byte_output = Gadgets.leftShift64(byte_output, i * 8);
    output = output.add(byte_output);
  }

  return output;
}

function sbox_public(input: Byte16): Byte16 {
  const enc_top = sbox(input.top);
  const enc_bot = sbox(input.bot);

  return new Byte16(enc_top, enc_bot);
}

export { sbox_public as sbox };

import { Struct, ZkProgram } from "o1js";
import { Byte16 } from "../primitives/Bytes.js";
import { shiftRows } from "../lib/ShiftRows.js";
import { sbox } from "../lib/SBox.js";
import { mixColumn } from "../lib/MixColumns.js";
import { addRoundKey } from "../lib/AddRoundKey.js";
import { NUM_ROUNDS_128 as NUM_ROUNDS } from "../utils/constants.js";
import { expandKey128 } from "../lib/KeyExpansion.js";

class IterativeAES128PublicInput extends Struct({
  cipher: Byte16,
}) {}

export function computeIterativeAes128Encryption(
  message: Byte16,
  key: Byte16,
): Byte16 {
  let state = message;
  const roundKeys = expandKey128(key);
  // Initial round key addition
  state = addRoundKey(state, roundKeys[0]);

  // Main rounds: SBox, ShiftRows, MixColumns, AddRoundKey
  for (let i = 1; i < NUM_ROUNDS; i++) {
    state = sbox(state);
    state = shiftRows(state);
    state = mixColumn(state);
    state = addRoundKey(state, roundKeys[i]);
  }

  // Final round (without MixColumns)
  state = sbox(state);
  state = shiftRows(state);
  state = addRoundKey(state, roundKeys[NUM_ROUNDS]);

  return state;
}

const IterativeAes128 = ZkProgram({
  name: "aes-verify-iterative",
  publicInput: IterativeAES128PublicInput,

  methods: {
    verifyAES128: {
      privateInputs: [Byte16, Byte16],

      async method(
        input: IterativeAES128PublicInput,
        message: Byte16,
        key: Byte16,
      ) {
        const state = computeIterativeAes128Encryption(message, key);
        state.assertEquals(input.cipher);
      },
    },
  },
});

export { IterativeAes128, IterativeAES128PublicInput };

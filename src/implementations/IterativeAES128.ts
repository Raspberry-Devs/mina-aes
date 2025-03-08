import { Provable, Struct, ZkProgram } from "o1js";
import { Byte16 } from "../primitives/Bytes.js";
import { shiftRows } from "../ShiftRows.js";
import { sbox } from "../SBox.js";
import { mixColumn } from "../MixColumns.js";
import { addRoundKey } from "../AddRoundKey.js";
import { NUM_ROUNDS_128 as NUM_ROUNDS } from "../utils/constants.js";

class IterativeAES128PublicInput extends Struct({
  cipher: Byte16,
}) {}

// !!!!! Key expansion done off chain !!!!!
export function computeIterativeAes128Encryption(
  message: Byte16,
  key: Byte16[],
): Byte16 {
  let state = message;

  // Initial round key addition
  state = addRoundKey(state, key[0]);

  // Main rounds: SBox, ShiftRows, MixColumns, AddRoundKey
  for (let i = 1; i < NUM_ROUNDS; i++) {
    state = sbox(state);
    state = shiftRows(state);
    state = mixColumn(state);
    state = addRoundKey(state, key[i]);
  }

  // Final round (without MixColumns)
  state = sbox(state);
  state = shiftRows(state);
  state = addRoundKey(state, key[NUM_ROUNDS]);

  return state;
}

const IterativeAes128 = ZkProgram({
  name: "aes-verify-iterative",
  publicInput: IterativeAES128PublicInput,

  methods: {
    verifyAES128: {
      privateInputs: [Byte16, Provable.Array(Byte16, NUM_ROUNDS + 1)],

      async method(
        input: IterativeAES128PublicInput,
        message: Byte16,
        roundKeys: Byte16[],
      ) {
        const state = computeIterativeAes128Encryption(message, roundKeys);
        state.assertEquals(input.cipher);
      },
    },
  },
});

export { IterativeAes128, IterativeAES128PublicInput };

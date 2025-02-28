import { Provable, Struct, ZkProgram } from "o1js";
import { Byte16 } from "./primitives/Bytes.js";
import { addRoundKey } from "./AddRoundKey.js";
import { shiftRows } from "./ShiftRows.js";
import { sbox } from "./SBox.js";
import { mixColumn } from "./MixColumns.js";

const NUM_ROUNDS = 10;

function encrypt(message: Byte16, key: Byte16[]): Byte16 {
  let state = message;

  state = addRoundKey(state, key[0]);

  for (let i = 1; i < NUM_ROUNDS; i++) {
    state = sbox(state);
    state = shiftRows(state);
    state = mixColumn(state);
    state = addRoundKey(state, key[i]);
  }
  state = sbox(state);
  state = shiftRows(state);
  state = addRoundKey(state, key[NUM_ROUNDS]);

  return state;
}

function encryptStageOne(message: Byte16, key: Byte16[]): Byte16 {
  let state = message;

  state = addRoundKey(state, key[0]);

  for (let i = 1; i < NUM_ROUNDS - 1; i++) {
    state = sbox(state);
    state = shiftRows(state);
    state = mixColumn(state);
    state = addRoundKey(state, key[i]);
  }

  return state;
}

function encryptStageTwo(message: Byte16, key: Byte16[]): Byte16 {
  let state = message;

  for (let i = NUM_ROUNDS - 1; i < NUM_ROUNDS; i++) {
    state = sbox(state);
    state = shiftRows(state);
    state = mixColumn(state);
    state = addRoundKey(state, key[i]);
  }

  state = sbox(state);
  state = shiftRows(state);
  state = addRoundKey(state, key[NUM_ROUNDS]);

  return state;
}

class AESPublicInput extends Struct({
  cipher: Byte16,
}) {}

const aesZKProgram = ZkProgram({
  name: "aes-verify",
  publicInput: AESPublicInput,

  methods: {
    verifyAES128: {
      privateInputs: [Byte16, Provable.Array(Byte16, NUM_ROUNDS + 1)],

      async method(
        input: AESPublicInput,
        message: Byte16,
        roundKeys: Byte16[],
      ) {
        const state = encrypt(message, roundKeys);

        return state.assertEquals(input.cipher);
      },
    },

    sbox: {
      privateInputs: [Byte16],

      async method(input: AESPublicInput, output: Byte16) {
        return sbox(input.cipher).assertEquals(output);
      },
    },

    mixColumns: {
      privateInputs: [Byte16],

      async method(input: AESPublicInput, output: Byte16) {
        return mixColumn(input.cipher).assertEquals(output);
      },
    },

    shiftRows: {
      privateInputs: [Byte16],

      async method(input: AESPublicInput, output: Byte16) {
        return shiftRows(input.cipher).assertEquals(output);
      },
    },

    addRoundKey: {
      privateInputs: [Byte16],

      async method(input: AESPublicInput, output: Byte16) {
        return addRoundKey(input.cipher, input.cipher).assertEquals(output);
      },
    },
  },
});

export {
  aesZKProgram,
  encryptStageOne,
  encryptStageTwo,
  encrypt,
  AESPublicInput,
};

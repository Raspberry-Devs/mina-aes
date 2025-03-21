import { Proof, Struct, ZkProgram } from "o1js";
import { Byte16 } from "../primitives/Bytes.js";
import { shiftRows } from "../lib/ShiftRows.js";
import { sbox } from "../lib/SBox.js";
import { mixColumn } from "../lib/MixColumns.js";
import { addRoundKey } from "../lib/AddRoundKey.js";
import { NUM_ROUNDS_128 as NUM_ROUNDS } from "../utils/constants.js";
import { expandKey128 } from "../lib/KeyExpansion.js";
import { encryptAES128, stringToHex } from "../utils/crypto.js";

class IterativeAES128PublicInput extends Struct({
  cipher: Byte16,
}) {}

/**
 * Computes the AES-128 encryption of a message using the given key.
 *
 * @param message The message to encrypt
 * @param key The key to use for encryption
 * @returns The encrypted message
 */
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

/**
 * A zkProgram that verifies a proof that a message was encrypted with AES-128 using the given key.
 */
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

class IterativeAES128MessagePublicInput extends Struct({
  cipher: Byte16,
  message: Byte16,
}) {}

/**
 * A zkProgram that verifies a proof that a message and cipher are conncted via AES-128 using the given key.
 */
const IterativeAes128MessagePublic = ZkProgram({
  name: "aes-verify-iterative-decrypt",
  publicInput: IterativeAES128MessagePublicInput,

  methods: {
    verifyAES128: {
      privateInputs: [Byte16],

      async method(input: IterativeAES128MessagePublicInput, key: Byte16) {
        const message = input.message;
        const state = computeIterativeAes128Encryption(message, key);
        state.assertEquals(input.cipher);
      },
    },
  },
});

/**
 * Generates a proof that the given message was encrypted with AES-128 using the given key.
 * The key must be in hex form.
 *
 * @param message The message to generate a proof for
 * @param keyHex The key to use for encryption in hex form
 * @returns A proof that the message was encrypted with AES-128 using the given key and encrypted message
 * @throws If the message is not 16 characters long or the key is not 32 characters long
 * @throws If the proof generation fails
 */
async function generateIterativeAes128Proof(
  message: string,
  keyHex: string, // Should we allow non hex strings?
): Promise<[Proof<IterativeAES128PublicInput, void>, string]> {
  if (message.length !== 16) {
    throw new Error("Message must be 16 characters long");
  }

  if (keyHex.length !== 32) {
    throw new Error("Key must be 32 characters long");
  }

  const messageHex = stringToHex(message);
  const cipher = encryptAES128(messageHex, keyHex);
  const { proof } = await IterativeAes128.verifyAES128(
    new IterativeAES128PublicInput({
      cipher: Byte16.fromHex(cipher),
    }),
    Byte16.fromHex(messageHex),
    Byte16.fromHex(keyHex),
  );

  return [proof, cipher];
}

export {
  generateIterativeAes128Proof,
  IterativeAes128,
  IterativeAES128PublicInput,
  IterativeAes128MessagePublic,
  IterativeAES128MessagePublicInput,
};

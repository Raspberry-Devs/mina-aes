import { Struct, SelfProof, ZkProgram, Field, Poseidon } from "o1js";
import { Byte16 } from "../primitives/Bytes.js";
import { computeIterativeAes128Encryption } from "./IterativeAES128.js";

/**
 * Public input for the AES-128 CTR mode verification circuit.
 *
 * @property cipher - The ciphertext produced by encrypting a single block.
 * @property iv - The initialization vector. This value must be randomly generated for each proof.
 */
class AES128CTRPublicInput extends Struct({
  cipher: Byte16,
  iv: Field, // Randomly generated IV that can be publicly disclosed.
}) {}

/**
 * Public output for the AES-128 CTR mode verification circuit.
 *
 * @property counter - The current counter value (starting from 1).
 * @property keyHash - The Poseidon hash of the key used in the encryption.
 */
class AES128CTRPublicOutput extends Struct({
  counter: Field,
  keyHash: Field,
}) {}

/**
 * Computes the cipher for a single block in CTR mode.
 *
 * @param iv_plus_ctr - The sum of the IV and counter.
 * @param key - The 128-bit key.
 * @param message - The plaintext message block.
 * @returns The ciphertext produced by XORing the plaintext with the key stream.
 *
 * The key stream is computed by applying an iterative AES-128 encryption on the IV+counter.
 */
export function computeCipher(
  iv_plus_ctr: Field,
  key: Byte16,
  message: Byte16,
): Byte16 {
  const curr_key: Byte16 = computeIterativeAes128Encryption(
    Byte16.fromField(iv_plus_ctr),
    key,
  );
  return Byte16.xor(message, curr_key);
}

/**
 * ZK program for verifying AES-128 CTR mode encryption using recursive proofs.
 *
 * It supports both a base case (for a single block) and an inductive step (for multiple blocks).
 * In addition to verifying the encryption, each proof computes and returns the Poseidon hash of the key.
 * In the inductive case, the key hash is compared with the previous proof's hash to enforce consistency.
 */
const Aes128Ctr = ZkProgram({
  name: "aes-verify-iterative",
  publicInput: AES128CTRPublicInput,
  publicOutput: AES128CTRPublicOutput,

  methods: {
    // Base case: Verify a single block encryption.
    base: {
      // Private inputs: plaintext message and key.
      privateInputs: [Byte16, Byte16],

      async method(input: AES128CTRPublicInput, message: Byte16, key: Byte16) {
        const cipher = computeCipher(input.iv, key, message);
        cipher.assertEquals(input.cipher);
        const keyHash = Poseidon.hash([key.toField()]);

        return {
          publicOutput: new AES128CTRPublicOutput({
            counter: Field(1),
            keyHash,
          }),
        };
      },
    },

    // Inductive step: Verify subsequent block encryptions.
    inductive: {
      // Private inputs:
      // - A recursive proof of the previous block's encryption.
      // - The plaintext message for the current block.
      // - The key for the current block.
      privateInputs: [
        SelfProof<AES128CTRPublicInput, AES128CTRPublicOutput>,
        Byte16,
        Byte16,
      ],

      async method(
        input: AES128CTRPublicInput,
        previousProof: SelfProof<AES128CTRPublicInput, AES128CTRPublicOutput>,
        message: Byte16,
        key: Byte16,
      ) {
        const currentKeyHash = Poseidon.hash([key.toField()]);
        currentKeyHash.assertEquals(previousProof.publicOutput.keyHash);
        previousProof.verify();
        input.iv.assertEquals(previousProof.publicInput.iv);

        const cipher = computeCipher(
          input.iv.add(previousProof.publicOutput.counter),
          key,
          message,
        );
        cipher.assertEquals(input.cipher);

        const newCounter = previousProof.publicOutput.counter.add(Field(1));
        return {
          publicOutput: new AES128CTRPublicOutput({
            counter: newCounter,
            keyHash: currentKeyHash,
          }),
        };
      },
    },
  },
});

export { Aes128Ctr, AES128CTRPublicInput };

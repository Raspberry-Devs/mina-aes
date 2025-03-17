import {
  Field,
  ZkProgram,
  Struct,
  DynamicProof,
  VerificationKey,
  Void,
  Poseidon,
} from "o1js";
import { computeIterativeAes128Encryption } from "../IterativeAES128.js";
import { Byte16 } from "../../primitives/Bytes.js";

/**
 * Public input for the AES-128 CTR mode verification circuit.
 * Contains cipher and message as public values
 * Key is also contained, but it is hashed to ensure it is kept private.
 * TODO: Can we prevent a way from AES message to be leaked, if environment is insecure?
 */
class AES128HelperPublicInput extends Struct({
  cipher: Byte16,
  message: Byte16,
  hashed_key: Field,
}) {}

class SideLoadedAESProof extends DynamicProof<AES128HelperPublicInput, void> {
  static publicInputType = AES128HelperPublicInput;
  static publicOutputType = Void;
  static maxProofsVerified = 2 as const;
}

/**
 * A zkProgram that verifies a proof that a message was encrypted with AES-128 using the given key AND DISCLOSES THE MESSAGE.
 * This one should only be used for counter mode only AS IT DISCLOSES THE MESSAGE.
 */
const CtrModeIterativeAes128Helper = ZkProgram({
  name: "aes-verify-iterative",
  publicInput: AES128HelperPublicInput,

  methods: {
    verifyAESCTRHelper: {
      privateInputs: [Byte16],

      async method(input: AES128HelperPublicInput, key: Byte16) {
        const state = computeIterativeAes128Encryption(input.message, key);
        // This ensures that the key stays consistent across blocks
        const hash = Poseidon.hashPacked(Byte16, key);

        hash.assertEquals(input.hashed_key);
        state.assertEquals(input.cipher);
      },
    },
  },
});

// This is used as a constant into the circuit
const vk_data = await CtrModeIterativeAes128Helper.compile();
// This ensures that the proof corresponds to our circuit
const vk = new VerificationKey(vk_data.verificationKey);

/**
 * Assert that Counter Mode is correctly performed on a list of blocks. Note that length assertions are not performed
 * and are instead delegated to the caller.
 * @param proofs ZK Proofs proving that each block was encrypted with AES-128 using the given key.
 * @param ciphers List of ciphers produced by the encryption of each block.
 * @param messages Corresponding list of messages that were encrypted.
 * @param iv Initial vector used for first block.
 */
function verifyIterativeCounterMode(
  proofs: SideLoadedAESProof[],
  ciphers: Byte16[],
  messages: Byte16[],
  key: Byte16,
  iv: Field,
): void {
  const hash_key = Poseidon.hashPacked(Byte16, key);

  proofs.forEach((proof, index) => {
    proof.verify(vk);
    const ctrCipher = proof.publicInput.cipher;
    const ctrInput = proof.publicInput.message;
    const message = messages[index];
    const counter = Field(index);

    // Ensure key is consistent across all blocks
    hash_key.assertEquals(proof.publicInput.hashed_key);
    ctrInput.assertEquals(Byte16.fromField(iv.add(counter)));
    message.assertEquals(Byte16.xor(ciphers[index], ctrCipher));
  });
}

export {
  CtrModeIterativeAes128Helper,
  AES128HelperPublicInput,
  verifyIterativeCounterMode,
  SideLoadedAESProof,
};

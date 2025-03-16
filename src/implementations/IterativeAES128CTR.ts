import { Proof, Field, ZkProgram, Struct } from "o1js";
import { computeIterativeAes128Encryption } from "./IterativeAES128.js";
import { Byte16 } from "../primitives/Bytes.js";

class AES128HelperPublicInput extends Struct({
  cipher: Byte16,
  message: Byte16,
}) {}
/**
 * A zkProgram that verifies a proof that a message was encrypted with AES-128 using the given key AND DISCLOSES THE MESSAGE.
 * This one should only be used for counter mode only AS IT DISCLOSES THE MESSAGE.
 */
const CtrModeIterativeAes128Helper = ZkProgram({
  name: "aes-verify-iterative",
  publicInput: AES128HelperPublicInput,

  methods: {
    verifyAES128: {
      privateInputs: [Byte16],

      async method(input: AES128HelperPublicInput, key: Byte16) {
        const state = computeIterativeAes128Encryption(input.message, key);
        state.assertEquals(input.cipher);
      },
    },
  },
});

function verifyIterativeCounterMode(
  proofs: Proof<AES128HelperPublicInput, void>[],
  ciphers: Byte16[],
  messages: Byte16[],
  iv: Field,
): void {
  proofs.forEach((proof, index) => {
    proof.verify();
    const ctrCipher = proof.publicInput.cipher;
    const ctrInput = proof.publicInput.message;
    const message = messages[index];
    const counter = Field(index);

    ctrInput.assertEquals(Byte16.fromField(iv.add(counter)));
    message.assertEquals(Byte16.xor(ciphers[index], ctrCipher));
  });
}

export {
  CtrModeIterativeAes128Helper,
  AES128HelperPublicInput,
  verifyIterativeCounterMode,
};

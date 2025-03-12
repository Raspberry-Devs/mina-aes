import { Struct, SelfProof, ZkProgram, Field } from "o1js";
import { Byte16 } from "../primitives/Bytes.js";
import { computeIterativeAes128Encryption } from "./IterativeAES128.js";

class AES128CTRPublicInput extends Struct({
  cipher: Byte16,
  // initialization vector: critical that this is provided randomly each time
  // This can be publicly disclosed and gives the verifier the befit of checking they have the correct IV
  // It can be made private in which case the verifier is not guaranteed they have the correct IV
  iv: Field,
}) {}

// Cipher under the CTR mode for a single block
export function computeCipher(
  iv_plus_ctr: Field,
  key: Byte16,
  message: Byte16, // plaintext
): Byte16 {
  // Use AES128 just to get the key
  const curr_key: Byte16 = computeIterativeAes128Encryption(
    Byte16.fromField(iv_plus_ctr),
    key,
  );
  // compute curr_key by encyrpting counter + iv with key with AES128
  // simply xor with the key to get ciphertext
  return Byte16.xor(message, curr_key);
}

const Aes128Ctr = ZkProgram({
  name: "aes-verify-iterative",
  publicInput: AES128CTRPublicInput,
  publicOutput: Field, // The counter

  methods: {
    // base case for a singleton block
    base: {
      privateInputs: [Byte16, Byte16],

      async method(input: AES128CTRPublicInput, message: Byte16, key: Byte16) {
        // ctr = 0, so iv passed as is
        const cipher = computeCipher(input.iv, key, message);
        cipher.assertEquals(input.cipher);
        return { publicOutput: Field(1) };
      },
    },
    inductive: {
      // the output type of the SelfProof is the Ctr
      privateInputs: [SelfProof<AES128CTRPublicInput, Field>, Byte16, Byte16],
      async method(
        input: AES128CTRPublicInput,
        previousProof: SelfProof<AES128CTRPublicInput, Field>,
        message: Byte16,
        key: Byte16, // TODO: How do I assert the prover always provides the same key to this function
      ) {
        previousProof.verify();
        input.iv.assertEquals(previousProof.publicInput.iv);
        const cipher = computeCipher(
          input.iv.add(previousProof.publicOutput),
          key,
          message,
        );
        cipher.assertEquals(input.cipher);
        return { publicOutput: previousProof.publicOutput.add(Field(1)) };
      },
    },
  },
});

export { Aes128Ctr, AES128CTRPublicInput };

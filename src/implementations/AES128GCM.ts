import { Struct, SelfProof, ZkProgram, Field, Poseidon } from "o1js";
import { Byte16 } from "../primitives/Bytes.js";
import { computeIterativeAes128Encryption } from "./IterativeAES128.js";

/**
 * Public input for the AES-128 GCM mode verification circuit.
 *
 * @property tag - The auth tag produced by encrypting all the blocks with auth data.
 * @property iv - The initialization vector. This value must be randomly generated for each proof.
 * @property cipherof0 - cipher of the block of 0 bits
 */
class AES128GCMPublicInput extends Struct({
  tag: Byte16,
  iv: Field,
  cipherOf0: Byte16,
}) {}

/**
 * Public output for the AES-128 GCM mode verification circuit.
 *
 * @property keyHash - Used to assert the same key is provided as private input always.
 * @property counter - The current counter value (starting from 1).
 */
class AES128GCMPublicOutput extends Struct({
  partialTag: Byte16,
  ctr: Field,
  authCtr: Field,
  keyHash: Field,
}) {}

// Cipher under the GCM mode for a single block
export function computeCipher(
  ctr: Field,
  key: Byte16,
  message: Byte16, // plaintext
): Byte16 {
  // Use AES128 just to get the key
  const curr_key: Byte16 = computeIterativeAes128Encryption(
    Byte16.fromField(ctr),
    key,
  );
  // compute curr_key by encyrpting counter + iv with key with AES128
  // simply xor with the key to get ciphertext
  return Byte16.xor(message, curr_key);
}

const Aes128Gcm = ZkProgram({
  name: "aes-verify-iterative",
  publicInput: AES128GCMPublicInput,
  publicOutput: AES128GCMPublicOutput, // The counter

  methods: {
    // base case: no actual encryption here, just setup
    base: {
      privateInputs: [Byte16],

      async method(input: AES128GCMPublicInput, key: Byte16) {
        computeIterativeAes128Encryption(Byte16.Zero(), key).assertEquals(
          input.cipherOf0,
        );
        return {
          publicOutput: {
            ctr: input.iv.add(Field(1)),
            authCtr: Field(0),
            partialTag: Byte16.fromField(Field(0)),
            keyHash: Poseidon.hash([key.toField()]),
          },
        };
      },
    },
    authDataPhase: {
      privateInputs: [
        SelfProof<AES128GCMPublicInput, AES128GCMPublicOutput>,
        Byte16,
      ],

      async method(
        input: AES128GCMPublicInput,
        prevProof: SelfProof<AES128GCMPublicInput, AES128GCMPublicOutput>,
        auth: Byte16,
      ) {
        prevProof.verify();
        input.iv.assertEquals(prevProof.publicInput.iv);
        input.cipherOf0.assertEquals(prevProof.publicInput.cipherOf0);

        return {
          publicOutput: {
            partialTag: auth.gcmMul(input.cipherOf0),
            authCtr: prevProof.publicOutput.authCtr.add(Field(1)),
            ctr: prevProof.publicOutput.ctr,
            keyHash: prevProof.publicOutput.keyHash,
          },
        };
      },
    },
    encryptionPhase: {
      privateInputs: [
        SelfProof<AES128GCMPublicInput, AES128GCMPublicOutput>,
        Byte16,
        Byte16,
      ],
      async method(
        input: AES128GCMPublicInput,
        prevProof: SelfProof<AES128GCMPublicInput, AES128GCMPublicOutput>,
        message: Byte16,
        key: Byte16,
      ) {
        prevProof.verify();
        prevProof.publicOutput.keyHash.assertEquals(
          Poseidon.hash([key.toField()]),
        );
        input.iv.assertEquals(prevProof.publicInput.iv);
        input.cipherOf0.assertEquals(prevProof.publicInput.cipherOf0);
        const cipher = computeCipher(prevProof.publicOutput.ctr, key, message);
        const partialTag = Byte16.xor(
          cipher,
          prevProof.publicOutput.partialTag,
        ).gcmMul(input.cipherOf0);

        return {
          publicOutput: {
            partialTag: partialTag,
            ctr: prevProof.publicOutput.ctr.add(1),
            authCtr: prevProof.publicOutput.authCtr,
            keyHash: prevProof.publicOutput.keyHash,
          },
        };
      },
    },
    final: {
      privateInputs: [
        SelfProof<AES128GCMPublicInput, AES128GCMPublicOutput>,
        Byte16,
      ],
      async method(
        input: AES128GCMPublicInput,
        prevProof: SelfProof<AES128GCMPublicInput, AES128GCMPublicOutput>,
        key: Byte16,
      ) {
        prevProof.verify();
        prevProof.publicOutput.keyHash.assertEquals(
          Poseidon.hash([key.toField()]),
        );
        input.iv.assertEquals(prevProof.publicInput.iv);
        input.cipherOf0.assertEquals(prevProof.publicInput.cipherOf0);

        // multiply by 128 to get the length in bits
        const lengths = Byte16.fromTwoFields(
          prevProof.publicOutput.authCtr.mul(128),
          prevProof.publicOutput.ctr.sub(input.iv).mul(128),
        );
        let tag = Byte16.xor(lengths, prevProof.publicOutput.partialTag).gcmMul(
          input.cipherOf0,
        );
        tag = Byte16.xor(
          computeIterativeAes128Encryption(Byte16.fromField(input.iv), key),
          tag,
        );
        tag.assertEquals(input.tag);
        return {
          publicOutput: {
            partialTag: tag,
            ctr: prevProof.publicOutput.ctr,
            authCtr: prevProof.publicOutput.authCtr,
            keyHash: prevProof.publicOutput.keyHash,
          },
        };
      },
    },
  },
});

export { Aes128Gcm, AES128GCMPublicInput };

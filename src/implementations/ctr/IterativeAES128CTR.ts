import {
  Struct,
  SelfProof,
  ZkProgram,
  Field,
  Poseidon,
  Provable,
  DynamicProof,
} from "o1js";
import { Byte16 } from "../../primitives/Bytes.js";
import { computeIterativeAes128Encryption } from "../IterativeAES128.js";

class AES128CTRPublicInput extends Struct({
  cipher: Byte16,
  iv: Byte16,
  key_hash: Field,
  ctr: Field,
}) {}

class AES128CtrPublicOutput extends Struct({
  cipher_hash: Field,
}) {}

class SideLoadedAESProof extends DynamicProof<
  AES128CTRPublicInput,
  AES128CtrPublicOutput
> {
  publicInput: AES128CTRPublicInput;
  publicOutput: AES128CtrPublicOutput;
  maxProofsVerified: 1;
}

// Cipher under the CTR mode for a single block
export function computeCipher(
  iv_plus_ctr: Byte16,
  key: Byte16,
  message: Byte16,
): Byte16 {
  // Use AES128 just to get the key
  const curr_key: Byte16 = computeIterativeAes128Encryption(iv_plus_ctr, key);
  // compute curr_key by encyrpting counter + iv with key with AES128
  // simply xor with the key to get ciphertext
  return Byte16.xor(message, curr_key);
}

const AES128Ctr = ZkProgram({
  name: "aes-verify-ctr-base",
  publicInput: AES128CTRPublicInput,
  publicOutput: AES128CtrPublicOutput,

  methods: {
    // base case for a singleton block
    base: {
      privateInputs: [Byte16, Byte16],

      async method(input: AES128CTRPublicInput, message: Byte16, key: Byte16) {
        // Assert that the key hash is correct
        Poseidon.hashPacked(Byte16, key).assertEquals(input.key_hash);
        // Assert that ctr = 0
        Field(0).assertEquals(input.ctr);

        // ctr = 0, so iv passed as is
        const cipher = computeCipher(input.iv, key, message);
        cipher.assertEquals(input.cipher);

        // TODO: Check whether we need a separator within our hash?
        const output = new AES128CtrPublicOutput({
          cipher_hash: Poseidon.hashPacked(Byte16, cipher),
        });

        return { publicOutput: output };
      },
    },
    inductive: {
      privateInputs: [
        SelfProof<AES128CTRPublicInput, AES128CtrPublicOutput>,
        Byte16,
        Byte16,
      ],
      async method(
        input: AES128CTRPublicInput,
        previousProof: SelfProof<AES128CTRPublicInput, AES128CtrPublicOutput>,
        message: Byte16,
        key: Byte16,
      ) {
        previousProof.verify();

        // Perform necessary assertions, including matches iv, key_hashes, correct counter, and correct cipher
        input.iv.assertEquals(previousProof.publicInput.iv);
        // This ensures that key is the same for all blocks
        input.key_hash.assertEquals(previousProof.publicInput.key_hash);
        Poseidon.hashPacked(Byte16, key).assertEquals(input.key_hash);

        // This ensures that counter is correclty incremented
        input.ctr.assertEquals(previousProof.publicInput.ctr.add(Field(1)));

        // TODO: Implement addition of the IV and the counter in Byte16 to reduce constraints
        const cipher = computeCipher(
          Byte16.fromField(input.iv.toField().add(input.ctr)),
          key,
          message,
        );
        cipher.assertEquals(input.cipher);

        // TODO: Check whether we need a separator within our hash?
        const output = new AES128CtrPublicOutput({
          cipher_hash: Poseidon.hashPacked(Provable.Array(Field, 2), [
            previousProof.publicOutput.cipher_hash,
            Poseidon.hashPacked(Byte16, cipher),
          ]),
        });
        return { publicOutput: output };
      },
    },
  },
});

export {
  AES128Ctr,
  AES128CTRPublicInput,
  AES128CtrPublicOutput,
  SideLoadedAESProof,
};

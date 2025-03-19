import {
  Field,
  Poseidon,
  Provable,
  Struct,
  VerificationKey,
  ZkProgram,
} from "o1js";
import { AES128Ctr, SideLoadedAESProof } from "./IterativeAES128CTR";
import { Byte16 } from "../../primitives/Bytes";

const NUM_BLOCKS = 2;

class AES128CTR256PublicInput extends Struct({
  proof: SideLoadedAESProof,
  ciphers: Provable.Array(Byte16, NUM_BLOCKS),
}) {}

// Compile the verification key for AES128CTR
const { verificationKey: vk_data } = await AES128Ctr.compile();
const vk = new VerificationKey(vk_data);

const AES128CTR256 = ZkProgram({
  name: "aes-verify-ctr-256",
  publicInput: AES128CTR256PublicInput,

  methods: {
    verifyAESCTR256: {
      privateInputs: [],

      async method(input: AES128CTR256PublicInput) {
        input.proof.verify(vk);
        input.proof.publicInput.ctr.assertEquals(NUM_BLOCKS - 1);

        // Verify the ciphers
        const cipher_internal_hash = Poseidon.hashPacked(
          Provable.Array(Field, NUM_BLOCKS),
          [
            Poseidon.hashPacked(Byte16, input.ciphers[0]),
            Poseidon.hashPacked(Byte16, input.ciphers[1]),
          ],
        );

        cipher_internal_hash.assertEquals(input.proof.publicOutput.cipher_hash);
      },
    },
  },
});

export { AES128CTR256, AES128CTR256PublicInput };

import { Provable, Struct, ZkProgram } from "o1js";
import {
  SideLoadedAESProof,
  verifyIterativeCounterMode,
} from "./IterativeAES128CTR";
import { Byte16 } from "../../primitives/Bytes";

const AES_CTR_256_LENGTH = 2;

class CTR128PublicInput extends Struct({
  cipher: Provable.Array(Byte16, AES_CTR_256_LENGTH),
  iv: Byte16,
}) {}

/**
 * A zkProgram that verifies a proof that a 256 bit message was encrypted with AES-128-CTR using the given key.
 */
const AES128CTR256 = ZkProgram({
  name: "aes-verify-iterative",
  publicInput: CTR128PublicInput,

  methods: {
    verifyAES128: {
      privateInputs: [
        Provable.Array(SideLoadedAESProof, AES_CTR_256_LENGTH),
        Provable.Array(Byte16, AES_CTR_256_LENGTH),
        Byte16,
      ],

      async method(
        pub_input: CTR512PublicInput,
        proofs: SideLoadedAESProof[],
        message: Byte16[],
        key: Byte16,
      ) {
        verifyIterativeCounterMode(
          proofs,
          pub_input.cipher,
          message,
          key,
          pub_input.iv.toField(),
        );
      },
    },
  },
});

const AES_CTR_512_LENGTH = 4;

class CTR512PublicInput extends Struct({
  cipher: Provable.Array(Byte16, AES_CTR_256_LENGTH),
  iv: Byte16,
}) {}

/**
 * A zkProgram that verifies a proof that a 512 bit message was encrypted with AES-128-CTR using the given key.
 */
const AE512CTR256 = ZkProgram({
  name: "aes-verify-iterative",
  publicInput: CTR512PublicInput,

  methods: {
    verifyAES128: {
      privateInputs: [
        Provable.Array(SideLoadedAESProof, AES_CTR_512_LENGTH),
        Provable.Array(Byte16, AES_CTR_512_LENGTH),
        Byte16,
      ],

      async method(
        pub_input: CTR512PublicInput,
        proofs: SideLoadedAESProof[],
        message: Byte16[],
        key: Byte16,
      ) {
        verifyIterativeCounterMode(
          proofs,
          pub_input.cipher,
          message,
          key,
          pub_input.iv.toField(),
        );
      },
    },
  },
});

export {
  AES128CTR256,
  CTR128PublicInput,
  AES_CTR_256_LENGTH,
  CTR512PublicInput,
  AE512CTR256,
  AES_CTR_512_LENGTH,
};

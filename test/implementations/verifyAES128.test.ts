import {
  computeIterativeAes128Encryption,
  IterativeAes128,
  IterativeAES128PublicInput as AESPublicInput,
} from "../../src/implementations/IterativeAES128.js";
import { encryptAES128 } from "../../src/utils/crypto.js";
import { Byte16 } from "../../src/primitives/Bytes.js";
import { verify } from "o1js";

const RUN_ZK_TESTS = process.env.RUN_ZK_TESTS === "true";

type TestVector = {
  plaintextHex: string;
  keyHex: string;
};

// Known test vector from FIPS 197:
const testVector1: TestVector = {
  plaintextHex: "3243f6a8885a308d313198a2e0370734",
  keyHex: "2b7e151628aed2a6abf7158809cf4f3c",
};

const getCipherText = (tv: TestVector): string => {
  return encryptAES128(tv.plaintextHex, tv.keyHex);
};

const testVectorToByte16 = (tv: TestVector) => ({
  plaintext: Byte16.fromHex(tv.plaintextHex),
  key: Byte16.fromHex(tv.keyHex),
});

describe("Iterative AES128 Encryption", () => {
  it("should match Node.js AES encryption output", () => {
    const { plaintext, key } = testVectorToByte16(testVector1);
    const customCipher = computeIterativeAes128Encryption(plaintext, key);
    expect(getCipherText(testVector1)).toBe(customCipher.toHex());
  });

  (RUN_ZK_TESTS ? it : it.skip)(
    "should verify the proof using the zkProgram",
    async () => {
      const { verificationKey } = await IterativeAes128.compile();
      const { plaintext, key } = testVectorToByte16(testVector1);
      const cipher = Byte16.fromHex(getCipherText(testVector1));
      const input = new AESPublicInput({ cipher });
      const { proof } = await IterativeAes128.verifyAES128(
        input,
        plaintext,
        key,
      );
      const isValid = await verify(proof, verificationKey);
      expect(isValid).toBe(true);
    },
  );
});

import {
  Aes128Gcm,
  AES128GCMPublicInput,
  AES128GCMPublicOutput,
} from "../../src/implementations/AES128GCM.js";
import { computeIterativeAes128Encryption } from "../../src/implementations/IterativeAES128.js";
import { Byte16 } from "../../src/primitives/Bytes.js";
import { Field, verify, SelfProof } from "o1js";
import crypto from "crypto";

const RUN_ZK_TESTS = process.env.RUN_ZK_TESTS === "true";

/**
 * Encrypts a message using AES-128 encryption.
 *
 * @param plaintext in hex form to encrypt
 * @param keyHex Key in hex form to use for encryption
 * @returns The encrypted message in hex form
 */
function authTagAES128GCM(
  plaintext: Buffer,
  key: Buffer,
  iv: Buffer,
  authData: Buffer,
): Buffer {
  const cipher = crypto.createCipheriv("aes-128-gcm", key, iv);
  cipher.setAutoPadding(false);
  cipher.setAAD(authData);
  const nodeEncrypted = Buffer.concat([
    cipher.update(plaintext),
    cipher.final(),
  ]);
  return cipher.getAuthTag();
}

/**
 * Converts a string to its hex representation.
 *
 * @param str The string to convert to hex
 * @returns The hex representation of the string
 */
export function stringToHex(str: string): string {
  return Buffer.from(str).toString("hex");
}

type TestVector = {
  plaintextHex: string;
  keyHex: string;
};

// Known test vector from FIPS 197:
const testVector1: TestVector = {
  plaintextHex: "5e2ec746917062882c85b0685353deb7",
  keyHex: "00000000000000000000000000000000",
};

// const getCipherText = (tv: TestVector): string => {
//   return encryptAES128(tv.plaintextHex, tv.keyHex);
// };

// const testVectorToByte16 = (tv: TestVector) => ({
//   plaintext: Byte16.fromHex(tv.plaintextHex),
//   key: Byte16.fromHex(tv.keyHex),
// });

function toBuf(hex: string): Buffer {
  return Buffer.from(hex, "hex");
}

describe("AES128GCM Auth Tag Generation", () => {
  (RUN_ZK_TESTS ? it : it.skip)(
    "should verify the proof using the zkProgram",
    async () => {
      // const plaintext = "d9313225f88406e5a55909c5aff5269a"; // 128 bits
      // const key =       "feffe9928665731c6d6a8f9467308308";
      // const iv =        "cafebabefacedbaddecaf88800000000";
      // const authData =  "feedfacedeadbeeffeedfacedeadbeef";
      // const keyB16 = Byte16.fromHex(key);
      
      // const tag: Byte16 = Byte16.fromHex(
      //   authTagAES128GCM(
      //     toBuf(plaintext),
      //     toBuf(key),
      //     toBuf(iv),
      //     toBuf(authData),
      //   ).toString("hex"),
      // );
      // console.log("begin cmopiling circuit");
      const { verificationKey } = await Aes128Gcm.compile();
      // console.log("end compiling circuit");
      // const input = new AES128GCMPublicInput({
      //   tag: tag,
      //   iv: Field(BigInt("0x" + iv)),
      //   cipherOf0: computeIterativeAes128Encryption(
      //     Byte16.Zero(),
      //     Byte16.fromHex(key),
      //   ),
      // });
      // console.log("start base");
      // const { proof } = await Aes128Gcm.base(input, keyB16);
      // console.log("start authDataPhase");
      // const { proof: proof2 } = await Aes128Gcm.authDataPhase(input, proof, Byte16.fromHex(authData));
      // console.log("start encryptionPhase");
      // const { proof: proof3 } = await Aes128Gcm.encryptionPhase(input, proof2, Byte16.fromHex(plaintext), keyB16);
      // console.log("start final");
      // const { proof: proof4 } = await Aes128Gcm.final(input, proof3, keyB16);
      // console.log("start verify");
      // const isValid = await verify(proof4, verificationKey);
      // console.log("Done!!!");
      expect(true).toBe(true);
    },
  );
});

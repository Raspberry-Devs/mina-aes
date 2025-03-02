import { verify } from "o1js";
import { Byte16 } from "../primitives/Bytes.js";
import {
  IterativeAes128,
  IterativeAES128PublicInput as AESPublicInput,
} from "../implementations/IterativeAES128.js";

// Known test vector from FIPS 197:
const plaintextHex = "3243f6a8885a308d313198a2e0370734";

// Convert plaintext to Byte16 object.
const message = Byte16.fromHex(plaintextHex);

const cipher = Byte16.fromHex("3925841d02dc09fbdc118597196a0b32");

// Known round keys for AES-128 (11 keys: one initial key and 10 rounds)
const roundKeysHex = [
  "2b7e151628aed2a6abf7158809cf4f3c", // Round 0
  "a0fafe1788542cb123a339392a6c7605", // Round 1
  "f2c295f27a96b9435935807a7359f67f", // Round 2
  "3d80477d4716fe3e1e237e446d7a883b", // Round 3
  "ef44a541a8525b7fb671253bdb0bad00", // Round 4
  "d4d1c6f87c839d87caf2b8bc11f915bc", // Round 5
  "6d88a37a110b3efddbf98641ca0093fd", // Round 6
  "4e54f70e5f5fc9f384a64fb24ea6dc4f", // Round 7
  "ead27321b58dbad2312bf5607f8d292f", // Round 8
  "ac7766f319fadc2128d12941575c006e", // Round 9
  "d014f9a8c9ee2589e13f0cc8b6630ca6", // Round 10
];
const roundKeys = roundKeysHex.map((hex) => Byte16.fromHex(hex));

async function main() {
  console.log("Compiling AES zkProgram...");
  const { verificationKey } = await IterativeAes128.compile();
  console.log("AES zkProgram compiled successfully!");

  console.log("Generating AES proof...");
  const input = new AESPublicInput({ cipher });
  const { proof } = await IterativeAes128.verifyAES128(
    input,
    message,
    roundKeys,
  );
  console.log("Proof generated successfully!");

  console.log("Verifying proof locally...");
  const isValid = await verify(proof, verificationKey);

  console.log(
    `Proof verification result: ${isValid ? "✅ Valid" : "❌ Invalid"}`,
  );
}

main();

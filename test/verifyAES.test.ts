import crypto from "crypto";
import { computeIterativeAes128Encryption } from "../src/implementations/IterativeAES128.js";
import { Byte16 } from "../src/primitives/Bytes.js";

describe("Iterative AES128 Encryption", () => {
  it("should match Node.js AES encryption output", () => {
    // Known test vector from FIPS 197:
    const plaintextHex = "3243f6a8885a308d313198a2e0370734";
    const keyHex = "2b7e151628aed2a6abf7158809cf4f3c";

    // Convert plaintext to Byte16 object.
    const plaintext = Byte16.fromHex(plaintextHex);

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

    const customCipher = computeIterativeAes128Encryption(plaintext, roundKeys);

    // Compute ciphertext using Node.js crypto module (AES-128-ECB mode, no padding).
    const keyBuffer = Buffer.from(keyHex, "hex");
    const plaintextBuffer = Buffer.from(plaintextHex, "hex");
    const cipher = crypto.createCipheriv("aes-128-ecb", keyBuffer, null);
    cipher.setAutoPadding(false); // Disable padding for full block encryption.
    const nodeEncrypted = Buffer.concat([
      cipher.update(plaintextBuffer),
      cipher.final(),
    ]);

    // Compare the outputs by converting them to hexadecimal strings.
    expect(nodeEncrypted.toString("hex")).toBe(customCipher.toHex());
  });
});

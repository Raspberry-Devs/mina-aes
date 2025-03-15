import { encryptAES128, stringToHex } from "../../src/utils/crypto";

describe("encryptAES128", () => {
  it("should encrypt a 16-byte block using AES-128-ECB", () => {
    // This is a well-known test vector from NIST SP800-38A:
    // Plaintext:  00112233445566778899aabbccddeeff
    // Key:        000102030405060708090a0b0c0d0e0f
    // Expected cipher text: 69c4e0d86a7b0430d8cdb78070b4c55a
    const plaintextHex = "00112233445566778899aabbccddeeff";
    const keyHex = "000102030405060708090a0b0c0d0e0f";
    const expectedCipherHex = "69c4e0d86a7b0430d8cdb78070b4c55a";

    expect(encryptAES128(plaintextHex, keyHex)).toBe(expectedCipherHex);
  });

  it("should return an empty string when given empty plaintext", () => {
    const plaintextHex = "";
    const keyHex = "000102030405060708090a0b0c0d0e0f";
    expect(encryptAES128(plaintextHex, keyHex)).toBe("");
  });
});

describe("stringToHex", () => {
  it("should convert a regular string to its hex representation", () => {
    const input = "Hello";
    const expected = "48656c6c6f"; // "H" -> 48, "e" -> 65, "l" -> 6c, "l" -> 6c, "o" -> 6f
    expect(stringToHex(input)).toBe(expected);
  });
});

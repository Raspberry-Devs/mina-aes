import { Field } from "o1js";
import { Byte16 } from "../../src/primitives/Bytes";
import {
  wordXor,
  getWords,
  rotWord,
  subWord,
  expandKey128,
  Word,
} from "../../src/lib/KeyExpansion";
import { expandedTestKey, testKey } from "./keys";

describe("wordXor", () => {
  it("XORs two words correctly", () => {
    const a = [Field(0x01), Field(0x02), Field(0x03), Field(0x04)] as Word;
    const b = [Field(0x04), Field(0x03), Field(0x02), Field(0x01)] as Word;
    const result = wordXor(a, b);
    expect(result.map((field) => field.toBigInt())).toEqual([
      0x05n,
      0x01n,
      0x01n,
      0x05n,
    ]);
  });
});

describe("getWords", () => {
  it("Extracts 4 words from a Byte16 input", () => {
    const input = Byte16.fromBytes([
      0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c,
      0x0d, 0x0e, 0x0f, 0x10,
    ]);
    const result = getWords(input);
    expect(result.flat().map((field) => field.toBigInt())).toEqual([
      0x01n,
      0x02n,
      0x03n,
      0x04n,
      0x05n,
      0x06n,
      0x07n,
      0x08n,
      0x09n,
      0x0an,
      0x0bn,
      0x0cn,
      0x0dn,
      0x0en,
      0x0fn,
      0x10n,
    ]);
  });
});

describe("rotWord", () => {
  it("Rotates a word to the left by one byte", () => {
    const input = [Field(0x01), Field(0x02), Field(0x03), Field(0x04)] as Word;
    const result = rotWord(input);
    expect(result.map((field) => field.toBigInt())).toEqual([
      0x02n,
      0x03n,
      0x04n,
      0x01n,
    ]);
  });
});

describe("subWord", () => {
  it("Substitutes a word using the S-box", () => {
    const input = [Field(0x00), Field(0x01), Field(0x02), Field(0x03)] as Word;
    const result = subWord(input);
    expect(result.map((field) => field.toBigInt())).toEqual([
      0x63n,
      0x7cn,
      0x77n,
      0x7bn,
    ]);
  });
});

describe("expandKey128", () => {
  it("Expands a 128-bit key into 11 round keys", () => {
    const roundKeys = expandKey128(testKey);
    roundKeys.forEach((key, i) => {
      expect(key.toHex()).toEqual(expandedTestKey[i].toHex());
    });
  });
});

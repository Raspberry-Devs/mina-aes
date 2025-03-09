import { Field, Gadgets } from "o1js";
import { Byte16 } from "../primitives/Bytes.js";
import { sbox_byte } from "./SBox.js";

// Each word consists of four 8-bit fields.
export type Word = [Field, Field, Field, Field];
const ZeroWord: Word = [Field(0), Field(0), Field(0), Field(0)];
const Rcon: Word[] = [
  [Field(0x01), Field(0x00), Field(0x00), Field(0x00)],
  [Field(0x02), Field(0x00), Field(0x00), Field(0x00)],
  [Field(0x04), Field(0x00), Field(0x00), Field(0x00)],
  [Field(0x08), Field(0x00), Field(0x00), Field(0x00)],
  [Field(0x10), Field(0x00), Field(0x00), Field(0x00)],
  [Field(0x20), Field(0x00), Field(0x00), Field(0x00)],
  [Field(0x40), Field(0x00), Field(0x00), Field(0x00)],
  [Field(0x80), Field(0x00), Field(0x00), Field(0x00)],
  [Field(0x1b), Field(0x00), Field(0x00), Field(0x00)],
  [Field(0x36), Field(0x00), Field(0x00), Field(0x00)],
];

/**
 * XORs two 32-bit words.
 *
 * @param a The first 32-bit word.
 * @param b The second 32-bit word.
 * @returns The result of the XOR operation.
 */
export function wordXor(a: Word, b: Word): Word {
  return [
    Gadgets.xor(a[0], b[0], 8),
    Gadgets.xor(a[1], b[1], 8),
    Gadgets.xor(a[2], b[2], 8),
    Gadgets.xor(a[3], b[3], 8),
  ];
}

/**
 * The round key for each round of the AES encryption algorithm.
 * Each round key consists of four 32-bit words.
 *
 * @param byte The Byte16 instance to extract words from.
 * @returns An array of four Field elements, each representing a 32-bit word.
 */
export function getWords(byte: Byte16): [Word, Word, Word, Word] {
  return byte.toColumns() as [Word, Word, Word, Word];
}

/**
 * Performs a circular left rotation by 8 bits on a 32-bit word.
 * Each Field element is treated as a 32-bit word (4 bytes).
 *
 * @param word The 32-bit Field element to rotate.
 * @returns The rotated 32-bit Field element.
 */
export function rotWord(word: Word): Word {
  return [word[1], word[2], word[3], word[0]];
}

/**
 * Substitutes each byte of a 32-bit word using the S-box.
 *
 * @param word The 32-bit word to substitute.
 * @returns The substituted 32-bit word.
 */
export function subWord(word: Word): Word {
  return word.map((field) => sbox_byte(field)) as Word;
}

/**
 * Expands a 128-bit key into an array of 11 round keys.
 *
 * @param key The 128-bit key to add to the state
 * @returns An array of 11 round keys
 */

export function expandKey128(key: Byte16): Byte16[] {
  const roundKeyWords: Word[] = [...getWords(key), ...Array(40).fill(ZeroWord)];
  for (let i = 4; i < 44; i++) {
    let temp: Word = roundKeyWords[i - 1];
    if (i % 4 === 0) {
      temp = wordXor(subWord(rotWord(temp)), Rcon[i / 4 - 1]);
    }
    roundKeyWords[i] = wordXor(roundKeyWords[i - 4], temp);
  }

  const roundKeys: Byte16[] = [];
  for (let i = 0; i < 11; i++) {
    const keyWords = roundKeyWords.slice(i * 4, i * 4 + 4);
    roundKeys.push(Byte16.fromColumns(keyWords));
  }
  return roundKeys;
}

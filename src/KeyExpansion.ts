import { Field, Gadgets } from "o1js";
import { Byte16 } from "./primitives/Bytes.js";
import { sbox } from "./SBox.js";

const Rcon: Field[] = [
  Field(BigInt("0x01000000")),
  Field(BigInt("0x02000000")),
  Field(BigInt("0x04000000")),
  Field(BigInt("0x08000000")),
  Field(BigInt("0x10000000")),
  Field(BigInt("0x20000000")),
  Field(BigInt("0x40000000")),
  Field(BigInt("0x80000000")),
  Field(BigInt("0x1B000000")),
  Field(BigInt("0x36000000")),
];

function getWords(byte: Byte16): [Field, Field, Field, Field] {
  const top = byte.top;
  const bot = byte.bot;
  const mask32 = Field(BigInt(0xffffffff));

  const w0 = Gadgets.and(Gadgets.rightShift64(top, 32), mask32, 64);
  const w1 = Gadgets.and(top, mask32, 64);
  const w2 = Gadgets.and(Gadgets.rightShift64(bot, 32), mask32, 64);
  const w3 = Gadgets.and(bot, mask32, 64);

  return [w0, w1, w2, w3];
}

function rotWord(word: Field): Field {
  return Gadgets.or(
    Gadgets.leftShift64(word, 8),
    Gadgets.rightShift64(word, 24),
    32,
  );
}

function subWord(word: Field): Field {
  return sbox(new Byte16(Field(0), word)).toField();
}

export function expandKey128(key: Byte16): Byte16[] {
  const roundKey = [...getWords(key), ...Array(40).fill(Field(0))];

  for (let i = 4; i < 44; i++) {
    let temp = roundKey[i - 1];
    if (i % 4 === 0) {
      temp = Gadgets.xor(subWord(rotWord(temp)), Rcon[i / 4 - 1], 32);
    }
    roundKey[i] = Gadgets.xor(roundKey[i - 4], temp, 32);
  }
  return roundKey.map((word) => new Byte16(Field(0), word));
}

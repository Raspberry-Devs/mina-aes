import { Bool, Field, Gadgets, Provable } from "o1js";
import { Byte16 } from "./primitives/Bytes.js";

export function mixColumn(input: Byte16): Byte16 {
  let top = Field(0);
  let bot = Field(0);

  for (let j = 0; j < 4; ++j) {
    const col: Field[] = [];
    for (let i = 3; i >= 0; --i) {
      const inp = Provable.if(new Bool(i < 2), input.bot, input.top);
      const shift = 24 + (i % 2) * 32 - j * 8;
      const mask = Gadgets.leftShift64(Field(0xff), shift);
      col.push(Gadgets.rightShift64(Gadgets.and(mask, inp, 64), shift));
    }
    const mixCol: Field[] = gmixColumn(col);
    // just do the loop for the output manually by popping off of mixCol
    bot = bot.add(Gadgets.leftShift64(mixCol[3], 24 - 8 * j));
    bot = bot.add(Gadgets.leftShift64(mixCol[2], 32 + 24 - 8 * j));
    top = top.add(Gadgets.leftShift64(mixCol[1], 24 - 8 * j));
    top = top.add(Gadgets.leftShift64(mixCol[0], 32 + 24 - 8 * j));
  }
  return new Byte16(top, bot);
}

function xor8(a: Field, b: Field): Field {
  return Gadgets.xor(a, b, 8);
}

function xor8_5(a: Field, b: Field, c: Field, d: Field, e: Field): Field {
  return xor8(xor8(xor8(xor8(a, b), c), d), e);
}

export function gmixColumn(r: Field[]): Field[] {
  const a: Field[] = [];
  const b: Field[] = [];

  // Process each byte in the column.
  for (let c = 0; c < 4; c++) {
    const value = r[c];

    a.push(value);

    // Compute h = r[c] & 0x80.
    const h = Gadgets.and(value, Field(0x80), 8).equals(Field(0x80));

    // Compute b[c] = r[c] << 1, i.e. multiply by 2.
    let b_val = value.mul(2);

    // TODO: zk magic to prevent inflating circuit
    b_val = Gadgets.xor(b_val, Field(0x1b).mul(h.toField()), 8);

    b.push(Gadgets.and(b_val, Field(0xff), 8));
  }

  // Now compute the new column bytes.
  // The C code uses XOR (^) to combine values.
  // We assume our helper xor8 (and xor8_5) performs an 8-bit XOR.
  const r0 = xor8_5(b[0], a[3], a[2], b[1], a[1]);
  const r1 = xor8_5(b[1], a[0], a[3], b[2], a[2]);
  const r2 = xor8_5(b[2], a[1], a[0], b[3], a[3]);
  const r3 = xor8_5(b[3], a[2], a[1], b[0], a[0]);

  return [r0, r1, r2, r3];
}

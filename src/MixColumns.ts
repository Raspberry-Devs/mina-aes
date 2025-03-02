import { Field, Gadgets } from "o1js";
import { Byte16 } from "./primitives/Bytes.js";

/**
 * Performs the AES MixColumn operation on a 128-bit value.
 * Performs a matrix multiplication on the input value, providing diffusion.
 * @param input Take in a 128-bit value represented as a Byte16 class
 * @returns Transformed 128-bit value represented as a Byte16 class
 */
export function mixColumn(input: Byte16): Byte16 {
  const cols = input.toColumns();
  const newCols: Field[][] = [];

  for (let j = 0; j < 4; ++j) {
    newCols.push(gmixColumn(cols[j]));
  }
  return Byte16.fromColumns(newCols);
}

function xor8(a: Field, b: Field): Field {
  return Gadgets.xor(a, b, 8);
}

function xor8_5(a: Field, b: Field, c: Field, d: Field, e: Field): Field {
  return xor8(xor8(xor8(xor8(a, b), c), d), e);
}

/**
 *
 * @param r A column of 4 bytes. Represented as an array of Field elements.
 * @returns Modified column of 4 bytes. Represented as an array of Field elements.
 */
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

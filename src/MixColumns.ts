import {
    Bool,
    Field,
    Gadgets,
    Provable,
  } from 'o1js';
  import { Byte16 } from './primitives/Bytes';
  import { FieldList } from './utils/list';
  
  export function mixColumn(input: Byte16): Byte16 {
  
      let top = Field(0)
      let bot = Field(0)
  
      for (let j = 0; j < 4; ++j) {
          let col = FieldList.empty();
          for (let i = 3; i >= 0; --i) {
              let inp = Provable.if(new Bool (i < 2), input.bot, input.top);
              let shift = 24 + (i%2)*32 - j*8;
              let mask = Gadgets.leftShift64(Field(0xff), shift);
              col.push(Gadgets.rightShift64(Gadgets.and(mask, inp, 64), shift));
          }
          let mixCol: FieldList = gmixColumn(col);
          // just do the loop for the output manually by popping off of mixCol
          bot = Gadgets.or(Gadgets.leftShift64(mixCol.pop(),      24 - 8*j), bot, 64);
          bot = Gadgets.or(Gadgets.leftShift64(mixCol.pop(), 32 + 24 - 8*j), bot, 64);
          top = Gadgets.or(Gadgets.leftShift64(mixCol.pop(),      24 - 8*j), top, 64);
          top = Gadgets.or(Gadgets.leftShift64(mixCol.pop(), 32 + 24 - 8*j), top, 64);
      }
      return new Byte16(top, bot);
  }
  
  function xor8(a: Field, b: Field): Field {
    return Gadgets.xor(a, b, 8);
  }
  
  function xor8_5(a: Field, b: Field, c: Field, d: Field, e: Field): Field {
    return xor8(xor8(xor8(xor8(a, b), c), d), e);
  }
  
  export function gmixColumn(r: FieldList): FieldList {
    let a = FieldList.empty();
    let b = FieldList.empty();
  
    // Process each byte in the column.
    let iterator = r.startIterating();
    for (let c = 0; c < 4; c++) {
      let value = iterator.next();
      value.assertLessThanOrEqual(Field(0xff));
  
      a.push(value);
  
      // Compute h = r[c] & 0x80.
      const h = Gadgets.and(value, Field(0x80), 8).equals(Field(0x80));
  
      // Compute b[c] = r[c] << 1, i.e. multiply by 2.
      let b_val = Gadgets.leftShift32(value, 1);
  
      // TODO: zk magic to prevent inflating circuit
      b_val = Provable.if(h, Gadgets.xor(b_val, Field(0x1b), 8), b_val);
  
      b.push(Gadgets.and(b_val, Field(0xff), 8));
    }
  
    // Harcode :(
    const b_3 = b.pop();
    const b_2 = b.pop();
    const b_1 = b.pop();
    const b_0 = b.pop();
  
    const a_3 = a.pop();
    const a_2 = a.pop();
    const a_1 = a.pop();
    const a_0 = a.pop();
  
    // Now compute the new column bytes.
    // The C code uses XOR (^) to combine values.
    // We assume our helper xor8 (and xor8_5) performs an 8-bit XOR.
    const r0 = xor8_5(b_0, a_3, a_2, b_1, a_1);
    const r1 = xor8_5(b_1, a_0, a_3, b_2, a_2);
    const r2 = xor8_5(b_2, a_1, a_0, b_3, a_3);
    const r3 = xor8_5(b_3, a_2, a_1, b_0, a_0);
  
    return FieldList.from([r0, r1, r2, r3]);
}
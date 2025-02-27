import { Field, Gadgets } from "o1js";
import { Byte16 } from "./primitives/Bytes";
/**
 * Modify the state to implement the shift operation.
 * Increasing cyclic shifts to the left down the rows.
 */
function shiftRows(state: Byte16): Byte16 {
  // let bitlen = 64;

  // Row 4: Shift bytes to the right. Last byte (n15) cycles back to location n12
  let row4 = Gadgets.rightShift64(
    Gadgets.and(Field(0x00000000ffffff00), state.bot, 64),
    8,
  );
  const n15 = Gadgets.and(Field(0x00000000000000ff), state.bot, 64);
  row4 = Gadgets.or(row4, Gadgets.leftShift64(n15, 24), 64);

  // Row 3: swap 1st half with 2nd half, ie (n8, n9, n10, n11) -> (n10, n11, n8, n9)
  const n8_9 = Gadgets.and(Field(0xffff000000000000), state.bot, 64);
  const nA_B = Gadgets.and(Field(0x0000ffff00000000), state.bot, 64);
  const row3 = Gadgets.or(
    Gadgets.rightShift64(n8_9, 16),
    Gadgets.leftShift64(nA_B, 16),
    64,
  );

  // Row 2: Shift bytes to the left. First byte (n4) cycles over to location n7
  let row2 = Gadgets.leftShift64(
    Gadgets.and(Field(0x0000000000ffffff), state.top, 64),
    8,
  );
  const n4 = Gadgets.and(Field(0x00000000ff000000), state.top, 64);
  row2 = Gadgets.or(row2, Gadgets.rightShift64(n4, 24), 64);

  // Row 1 do nothing, ie copy the first 4 bytes as is
  const row1 = Gadgets.and(Field(0xffffffff00000000), state.top, 64);

  // collate everything together
  return new Byte16(Gadgets.or(row1, row2, 64), Gadgets.or(row3, row4, 64));
}

export { shiftRows };

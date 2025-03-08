import { Byte16 } from "../primitives/Bytes.js";

/**
 * Modify the state to implement the shift operation.
 * Increasing cyclic shifts to the left down the rows.
 */
function shiftRows(state: Byte16): Byte16 {
  const columns = state.toColumns();

  // Shift the rows
  const newRows = [
    [columns[0][0], columns[1][1], columns[2][2], columns[3][3]],
    [columns[1][0], columns[2][1], columns[3][2], columns[0][3]],
    [columns[2][0], columns[3][1], columns[0][2], columns[1][3]],
    [columns[3][0], columns[0][1], columns[1][2], columns[2][3]],
  ];

  return Byte16.fromColumns(newRows);
}

export { shiftRows };

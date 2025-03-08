import { Field, Struct, Gadgets, Provable } from "o1js";

/**
 * Represents a 128-bit field element for AES encryption
 */
export class Byte16 extends Struct({
  // TODO: Its not clear which of the nested arrays are columns and which are rows
  value: Provable.Array(Provable.Array(Field, 4), 4),
}) {
  constructor(value: Field[][]) {
    super({ value });
  }

  static Zero(): Byte16 {
    return new Byte16(
      Array.from({ length: 4 }, () =>
        Array.from({ length: 4 }, () => Field(0)),
      ),
    );
  }

  /**
   * Performs equality check on two Byte16 values.
   * @param other Another Byte16 instance.
   */
  assertEquals(other: Byte16) {
    // Convert the Byte16 instances to Field elements.
    const thisField = this.toField();
    const otherField = other.toField();

    // Check if the Field elements are equal.
    thisField.assertEquals(otherField);
  }

  /**
   * Converts an array of 16 bytes into a Byte16 instance.
   * NONPROVABLE: This function should only be used for testing purposes.
   *
   * Assumes the input is in AES column‑major order:
   *  - Bytes 0–3: Column 0
   *  - Bytes 4–7: Column 1
   *  - Bytes 8–11: Column 2
   *  - Bytes 12–15: Column 3
   *
   * The left half consists of columns 0 and 1 (first 8 bytes),
   * and the right half consists of columns 2 and 3 (last 8 bytes).
   *
   * @param bytes An array of 16 numbers, each between 0 and 255.
   * @returns A Byte16 instance.
   */
  static fromBytes(bytes: number[]): Byte16 {
    if (bytes.length !== 16) {
      throw new Error(`Expected 16 bytes, but got ${bytes.length}.`);
    }

    for (const byte of bytes) {
      if (byte < 0 || byte > 255) {
        throw new Error(
          "Byte value 256 is out of range. Must be between 0 and 255.",
        );
      }
    }

    const f_bytes = bytes.map((byte) => Field(byte));

    // Chunk into four columns
    const cols: Field[][] = [];
    for (let i = 0; i < 4; i++) {
      cols.push(f_bytes.slice(i * 4, (i + 1) * 4));
    }

    return new Byte16(cols);
  }

  /**
   * Converts the Byte16 instance back into an array of 16 bytes.
   * NONPROVABLE: This function should only be used for testing purposes.
   * The output is in AES column‑major order.
   *
   * @returns An array of 16 numbers, each between 0 and 255.
   */
  toBytes(): number[] {
    return this.value.flat().map((field) => Number(field.toBigInt()));
  }

  /**
   * Converts a Byte16 instance into a 4x4 matrix of Field elements (each one byte)
   * in standard AES column‑major order.
   *
   * The left half (this.left) provides columns 0 and 1,
   * and the right half (this.right) provides columns 2 and 3.
   *
   * @returns A 4x4 matrix of Field elements.
   */
  toColumns(): Field[][] {
    return this.value;
  }

  /**
   * Converts a 4x4 matrix (in column‑major order) into a Byte16 instance.
   * Assumes that the left two columns (cols[0] and cols[1]) form the left half,
   * and the right two columns (cols[2] and cols[3]) form the right half.
   *
   * @param cols 4x4 matrix of byte‑sized Field elements.
   * @returns A Byte16 instance.
   */
  static fromColumns(cols: Field[][]): Byte16 {
    return new Byte16(cols);
  }

  static readonly COL_SIZE = 4;

  /**
   * Returns a Field representation of the full 128-bit value.
   *
   * @returns Field representation of the Byte16 instance.
   */
  toField(): Field {
    let out = Field(0);
    for (let i = 0; i < Byte16.COL_SIZE; i++) {
      for (let j = 0; j < Byte16.COL_SIZE; j++) {
        const byte = this.value[i][j];
        // Compute the exponent for this byte.
        const exponent =
          (Byte16.COL_SIZE - i - 1) * Byte16.COL_SIZE +
          (Byte16.COL_SIZE - j - 1);
        // The factor is 256^exponent.
        const factor = Field(256 ** exponent);
        out = out.add(byte.mul(factor));
      }
    }
    return out;
  }

  /**
   * Converts a Field value into a Byte16 instance.
   * @param field field must fit into 128 bits, otherwise behaviour is undefined
   * @returns A Byte16 instance representing the field value.
   */
  static fromField(field: Field): Byte16 {
    // Create Byte16 as witness and verify equality with the field.
    const byte16 = Provable.witness(Byte16, () => {
      return Byte16.fromBigInt(field.toBigInt());
    });

    // Check that the field is equal to the Byte16 value.
    byte16.toField().assertEquals(field);
    return byte16;
  }

  /**
   * Converts a BigInt value into a Byte16 instance.
   * NONPROVABLE: Can be used as witness
   * @param value the big integer to convert, must be 128 bits
   * @returns new Byte16 class
   */
  static fromBigInt(value: bigint): Byte16 {
    const bytes = [];
    const SIZE = 16;
    for (let i = 0; i < SIZE; i++) {
      const byte = (value >> BigInt(i * 8)) & 0xffn;
      bytes[SIZE - i - 1] = Number(byte);
    }
    return Byte16.fromBytes(bytes);
  }

  /**
   * Performs an 8-bit XOR on each corresponding byte of two Byte16 instances.
   *
   * @param a First Byte16 instance.
   * @param b Second Byte16 instance.
   * @returns A new Byte16 instance representing the XOR result.
   */
  static xor(a: Byte16, b: Byte16): Byte16 {
    const result: Field[][] = [];
    for (let col = 0; col < 4; col++) {
      const newCol: Field[] = [];
      for (let row = 0; row < 4; row++) {
        // XOR each byte using an 8-bit operation.
        newCol.push(Gadgets.xor(a.value[col][row], b.value[col][row], 8));
      }
      result.push(newCol);
    }
    return new Byte16(result);
  }

  /**
   * Converts a 32-character hex string into a Byte16 instance.
   * NONPROVABLE: For testing only.
   *
   * The hex string must be 32 characters long.
   * The first 16 characters (8 bytes) form the left half (columns 0 and 1),
   * and the last 16 characters form the right half (columns 2 and 3).
   *
   * @param hex A 32-character hex string.
   * @returns A Byte16 instance.
   */
  static fromHex(hex: string): Byte16 {
    if (hex.length !== 32) {
      throw new Error("Expected 32 characters in hex string.");
    }
    // Helper: convert a hex string (even length) to an array of numbers.
    function hexToBytes(hexStr: string): number[] {
      const bytes: number[] = [];
      for (let i = 0; i < hexStr.length; i += 2) {
        bytes.push(parseInt(hexStr.slice(i, i + 2), 16));
      }
      return bytes;
    }
    const leftHex = hex.slice(0, 16);
    const rightHex = hex.slice(16);
    const leftBytes = hexToBytes(leftHex); // 8 bytes
    const rightBytes = hexToBytes(rightHex); // 8 bytes

    const cols: Field[][] = [
      // Left half: columns 0 and 1.
      [
        Field(leftBytes[0]),
        Field(leftBytes[1]),
        Field(leftBytes[2]),
        Field(leftBytes[3]),
      ],
      [
        Field(leftBytes[4]),
        Field(leftBytes[5]),
        Field(leftBytes[6]),
        Field(leftBytes[7]),
      ],
      // Right half: columns 2 and 3.
      [
        Field(rightBytes[0]),
        Field(rightBytes[1]),
        Field(rightBytes[2]),
        Field(rightBytes[3]),
      ],
      [
        Field(rightBytes[4]),
        Field(rightBytes[5]),
        Field(rightBytes[6]),
        Field(rightBytes[7]),
      ],
    ];
    return new Byte16(cols);
  }

  /**
   * Converts the Byte16 instance into a 32-character hex string.
   * NONPROVABLE: For testing only.
   *
   * The output is formed by concatenating:
   *  - Left half: columns 0 and 1 (8 bytes total)
   *  - Right half: columns 2 and 3 (8 bytes total)
   *
   * @returns A 32-character hex string.
   */
  toHex(): string {
    let leftHex = "";
    // Columns 0 and 1 form the left half.
    for (let col = 0; col < 2; col++) {
      for (let row = 0; row < 4; row++) {
        const byte = this.value[col][row].toBigInt();
        leftHex += byte.toString(16).padStart(2, "0");
      }
    }
    let rightHex = "";
    // Columns 2 and 3 form the right half.
    for (let col = 2; col < 4; col++) {
      for (let row = 0; row < 4; row++) {
        const byte = this.value[col][row].toBigInt();
        rightHex += byte.toString(16).padStart(2, "0");
      }
    }
    return leftHex + rightHex;
  }
}

import { Field, Struct, Gadgets } from "o1js";

/**
 * Represents a 128-bit field element for AES encryption
 * **IMPORTANT** that left and right represent the left two columns and right two columns
 * of a 4x4 AES state matrix (each column is 4 bytes).
 * @param left  The 64-bit Field containing the left two columns (columns 0 and 1)
 * @param right The 64-bit Field containing the right two columns (columns 2 and 3)
 */
export class Byte16 extends Struct({
  left: Field,
  right: Field,
}) {
  // 2^64 as a Field constant for splitting a 128-bit element into two 64-bit halves
  static readonly TWO64 = Field(BigInt(1) << BigInt(64));

  constructor(left: Field, right: Field) {
    super({ left, right });
    // Ensure each section is less than 2^64 to fit within 8 bytes.
    left.assertLessThan(Byte16.TWO64);
    right.assertLessThan(Byte16.TWO64);
  }

  /**
   * Performs equality check on two Byte16 values.
   * @param other Another Byte16 instance.
   */
  assertEquals(other: Byte16) {
    this.left.assertEquals(other.left);
    this.right.assertEquals(other.right);
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
    let leftValue = BigInt(0);
    let rightValue = BigInt(0);
    for (let i = 0; i < 8; i++) {
      const byte = bytes[i];
      if (byte < 0 || byte > 255) {
        throw new Error(
          `Byte value ${byte} is out of range. Must be between 0 and 255.`,
        );
      }
      leftValue = (leftValue << BigInt(8)) | BigInt(byte);
    }
    for (let i = 8; i < 16; i++) {
      const byte = bytes[i];
      if (byte < 0 || byte > 255) {
        throw new Error(
          `Byte value ${byte} is out of range. Must be between 0 and 255.`,
        );
      }
      rightValue = (rightValue << BigInt(8)) | BigInt(byte);
    }
    return new Byte16(Field(leftValue), Field(rightValue));
  }

  /**
   * Converts the Byte16 instance back into an array of 16 bytes.
   * NONPROVABLE: This function should only be used for testing purposes.
   * The output is in AES column‑major order.
   *
   * @returns An array of 16 numbers, each between 0 and 255.
   */
  toBytes(): number[] {
    const leftBytes = new Array<number>(8);
    const rightBytes = new Array<number>(8);
    let leftVal = this.left.toBigInt();
    let rightVal = this.right.toBigInt();

    for (let i = 7; i >= 0; i--) {
      leftBytes[i] = Number(leftVal & BigInt(0xff));
      leftVal >>= BigInt(8);
    }
    for (let i = 7; i >= 0; i--) {
      rightBytes[i] = Number(rightVal & BigInt(0xff));
      rightVal >>= BigInt(8);
    }
    return leftBytes.concat(rightBytes);
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
    // Define masks for an 8-bit and a 32-bit word.
    const mask8 = Field(0xff);
    const mask32 = Field(0xffffffff);

    // For the left half (columns 0 and 1):
    // The top 32 bits form column 0 and the lower 32 bits form column 1.
    const col0Word = Gadgets.rightShift64(this.left, 32); // top 32 bits of left half
    const col1Word = Gadgets.and(this.left, mask32, 64); // lower 32 bits of left half

    // For the right half (columns 2 and 3):
    // The top 32 bits form column 2 and the lower 32 bits form column 3.
    const col2Word = Gadgets.rightShift64(this.right, 32); // top 32 bits of right half
    const col3Word = Gadgets.and(this.right, mask32, 64); // lower 32 bits of right half

    // A helper function that splits a 32-bit word into four 8-bit bytes.
    function split32(word: Field): Field[] {
      const byte0 = Gadgets.and(Gadgets.rightShift64(word, 24), mask8, 64);
      const byte1 = Gadgets.and(Gadgets.rightShift64(word, 16), mask8, 64);
      const byte2 = Gadgets.and(Gadgets.rightShift64(word, 8), mask8, 64);
      const byte3 = Gadgets.and(word, mask8, 64);
      return [byte0, byte1, byte2, byte3];
    }

    // Split each 32-bit column word into an array of four bytes.
    const col0 = split32(col0Word);
    const col1 = split32(col1Word);
    const col2 = split32(col2Word);
    const col3 = split32(col3Word);

    return [col0, col1, col2, col3];
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
    // Build the left 64-bit value from columns 0 and 1.
    let left = Field(0);
    for (let col = 0; col < 2; col++) {
      for (let i = 0; i < 4; i++) {
        left = Gadgets.or(Gadgets.leftShift64(left, 8), cols[col][i], 64);
      }
    }
    // Build the right 64-bit value from columns 2 and 3.
    let right = Field(0);
    for (let col = 2; col < 4; col++) {
      for (let i = 0; i < 4; i++) {
        right = Gadgets.or(Gadgets.leftShift64(right, 8), cols[col][i], 64);
      }
    }
    return new Byte16(left, right);
  }

  /**
   * Returns a Field representation of the full 128-bit value.
   * The full value is computed as: (left * 2^64) + right.
   *
   * @returns Field representation of the Byte16 instance.
   */
  toField(): Field {
    return this.right.add(this.left.mul(Byte16.TWO64));
  }

  /**
   * Perform XOR operation between two Byte16 instances.
   *
   * @param a First Byte16 instance.
   * @param b Second Byte16 instance.
   * @returns A new Byte16 instance representing the XOR result.
   */
  static xor(a: Byte16, b: Byte16): Byte16 {
    return new Byte16(
      Gadgets.xor(a.left, b.left, 64),
      Gadgets.xor(a.right, b.right, 64),
    );
  }

  /**
   * Converts a hex string to a Byte16 instance.
   * NONPROVABLE: This function should only be used for testing purposes.
   *
   * The hex string must be 32 characters long. The first 16 characters form the left half,
   * and the last 16 form the right half.
   *
   * @param hex A 32-character hex string.
   * @returns A Byte16 instance.
   */
  static fromHex(hex: string): Byte16 {
    if (hex.length !== 32) {
      throw new Error("Expected 32 characters in hex string.");
    }
    const left = Field(BigInt(`0x${hex.slice(0, 16)}`));
    const right = Field(BigInt(`0x${hex.slice(16)}`));
    return new Byte16(left, right);
  }

  /**
   * Converts the Byte16 instance into a hex string.
   * NONPROVABLE: This function should only be used for testing purposes.
   *
   * @returns A 32-character hex string representing the Byte16 instance.
   */
  toHex(): string {
    return (
      this.left.toBigInt().toString(16).padStart(16, "0") +
      this.right.toBigInt().toString(16).padStart(16, "0")
    );
  }
}

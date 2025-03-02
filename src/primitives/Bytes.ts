import { Field, Struct, Gadgets } from "o1js";

/**
 * Represents a 64-bit field element for AES encryption
 * @param top The upper 32-bits of the 64-bit field element
 * @param bot The lower 32-bits of the 64-bit field element
 */
export class Byte16 extends Struct({
  top: Field,
  bot: Field,
}) {
  // 2^128 as a Field constant for constraint checks
  static readonly TWO64 = Field(BigInt(1) << BigInt(64));

  constructor(top: Field, bot: Field) {
    super({ top, bot });
    // Ensure each section is less than 2^64 to fit within 8 bytes
    top.assertLessThan(Byte16.TWO64);
    bot.assertLessThan(Byte16.TWO64);
  }

  /**
   * Performs equality check on two Byte16 values
   * @param other
   */
  assertEquals(other: Byte16) {
    this.top.assertEquals(other.top);
    this.bot.assertEquals(other.bot);
  }

  /**
   * Converts an array of 16 bytes into a Byte16 instance.
   * NONPROVABLE: This function should only be used for testing purposes.
   * @param bytes An array of 16 numbers, each between 0 and 255.
   * @returns A Byte16 instance.
   */
  static fromBytes(bytes: number[]): Byte16 {
    if (bytes.length !== 16) {
      throw new Error(`Expected 16 bytes, but got ${bytes.length}.`);
    }
    let top = BigInt(0);
    let bot = BigInt(0);
    for (let i = 0; i < 16; i++) {
      const byte = bytes[i];
      if (byte < 0 || byte > 255) {
        throw new Error(
          `Byte value ${byte} is out of range. Must be between 0 and 255.`,
        );
      }

      if (i < 8) {
        top = (top << BigInt(8)) | BigInt(byte);
      } else {
        bot = (bot << BigInt(8)) | BigInt(byte);
      }
    }
    return new Byte16(Field(top), Field(bot));
  }

  /**
   * Converts the Byte16 instance back into an array of 16 bytes. Note this should be used for testing purposes only.
   * NONPROVABLE: This function should only be used for testing purposes.
   * @returns An array of 16 numbers, each between 0 and 255.
   */
  toBytes(): number[] {
    let top = this.top.toBigInt();
    let bot = this.bot.toBigInt();
    const bytes = new Array<number>(16);
    for (let i = 15; i >= 0; i--) {
      if (i < 8) {
        bytes[i] = Number(top & BigInt(0xff));
        top >>= BigInt(8);
      } else {
        bytes[i] = Number(bot & BigInt(0xff));
        bot >>= BigInt(8);
      }
    }
    return bytes;
  }

  /**
   * Converts a Byte16 instance into a 4x4 matrix of Field elements - each one byte
   * @returns A 4x4 matrix of Field elements.
   */
  toColumns(): Field[][] {
    // Get first column
    const arr: Field[][] = [];
    for (let i = 0; i < 4; i++) {
      const first = Gadgets.and(
        Gadgets.rightShift64(this.top, (7 - i) * 8),
        Field(0xff),
        64,
      );
      const second = Gadgets.and(
        Gadgets.rightShift64(this.top, (3 - i) * 8),
        Field(0xff),
        64,
      );
      const third = Gadgets.and(
        Gadgets.rightShift64(this.bot, (7 - i) * 8),
        Field(0xff),
        64,
      );
      const fourth = Gadgets.and(
        Gadgets.rightShift64(this.bot, (3 - i) * 8),
        Field(0xff),
        64,
      );

      arr.push([first, second, third, fourth]);
    }

    return arr;
  }

  /**
   * Converts matrix representation into Byte16 instance.
   * @param cols 4x4 matrix of byte sized Field elements
   * @returns Byte16 instance
   */
  static fromColumns(cols: Field[][]): Byte16 {
    let top = Field(0);
    // Reassemble the "top" 64 bits in order:
    // Order: cols[0][0], cols[1][0], cols[2][0], cols[3][0],
    //        cols[0][1], cols[1][1], cols[2][1], cols[3][1]
    const topBytesOrder = [
      cols[0][0],
      cols[1][0],
      cols[2][0],
      cols[3][0],
      cols[0][1],
      cols[1][1],
      cols[2][1],
      cols[3][1],
    ];
    for (let i = 0; i < topBytesOrder.length; i++) {
      top = Gadgets.or(Gadgets.leftShift64(top, 8), topBytesOrder[i], 64);
    }

    let bot = Field(0);
    // Reassemble the "bot" 64 bits in order:
    // Order: cols[0][2], cols[1][2], cols[2][2], cols[3][2],
    //        cols[0][3], cols[1][3], cols[2][3], cols[3][3]
    const botBytesOrder = [
      cols[0][2],
      cols[1][2],
      cols[2][2],
      cols[3][2],
      cols[0][3],
      cols[1][3],
      cols[2][3],
      cols[3][3],
    ];
    for (let i = 0; i < botBytesOrder.length; i++) {
      bot = Gadgets.or(Gadgets.leftShift64(bot, 8), botBytesOrder[i], 64);
    }

    return new Byte16(top, bot);
  }

  /**
   *
   * @returns Field representation of the Byte16 instance
   */
  toField(): Field {
    return this.bot.add(this.top.mul(Byte16.TWO64));
  }

  /**
   * Perform XOR operation between two Byte values.
   * @param a First Byte struct.
   * @param b Second Byte struct.
   * @returns A new Byte struct representing the XOR result.
   */
  static xor(a: Byte16, b: Byte16): Byte16 {
    // AES uses 128 bit sizes for all operations
    return new Byte16(
      Gadgets.xor(a.top, b.top, 64),
      Gadgets.xor(a.bot, b.bot, 64),
    );
  }
}

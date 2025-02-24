import { Field, Struct, Gadgets } from "o1js";

/**
 * A struct that represents 16 bytes packed into a single Field element.
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

  assertEquals(other: Byte16) {
    this.top.assertEquals(other.top);
    this.bot.assertEquals(other.bot);
  }

  /**
   * Converts an array of 16 bytes into a Byte16 instance.
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
   * Converts the Byte16 instance back into an array of 16 bytes.
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

  static fromColumns(cols: Field[][]): Byte16 {
    // Build top first
    let top = Field(0);
    let bot = Field(0);
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 4; j++) {
        top = Gadgets.or(Gadgets.leftShift64(top, 8), cols[i][j], 64);
      }
    }

    for (let i = 2; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        bot = Gadgets.or(Gadgets.leftShift64(bot, 8), cols[i][j], 64);
      }
    }

    return new Byte16(top, bot);
  }

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

import { Field } from "o1js";
import { Byte16 } from "../../src/primitives/Bytes";
import { describe, it, expect } from "@jest/globals";

describe("Bytes", () => {
  it("Converts byte array to Byte16 instance and back", () => {
    // Example byte array in AES column‑major order:
    // Bytes 0–7 become the left half (columns 0–1)
    // Bytes 8–15 become the right half (columns 2–3)
    const byteArray = [
      0x01, 0xab, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0, 0x12, 0x34, 0x56,
      0x78, 0x9a, 0xbc, 0xef,
    ];

    // Create Byte16 instance from byte array.
    const byte16Instance = Byte16.fromBytes(byteArray);

    // Convert back to byte array.
    const convertedBack = byte16Instance.toBytes();

    expect(convertedBack).toEqual(byteArray);
  });

  it("Throws error when byte array is not 16 bytes", () => {
    const byteArray = [
      0x01, 0xab, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0, 0x12, 0x34, 0x56,
      0x78, 0x9a, 0xbc,
    ];

    expect(() => Byte16.fromBytes(byteArray)).toThrow(
      "Expected 16 bytes, but got 15.",
    );
  });

  it("Throws error when byte array is too large", () => {
    const byteArray = [
      0x01, 0xab, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0, 0x12, 0x34, 0x56,
      0x78, 0x9a, 0xbc, 0xff, 0xff,
    ];

    expect(() => Byte16.fromBytes(byteArray)).toThrow(
      "Expected 16 bytes, but got 17.",
    );
  });

  it("Throws error when byte value is out of range", () => {
    const byteArray = [
      0x01, 0xab, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0, 0x12, 0x34, 0x56,
      0x78, 0x9a, 0xbc, 0x100,
    ];

    expect(() => Byte16.fromBytes(byteArray)).toThrow(
      "Byte value 256 is out of range. Must be between 0 and 255.",
    );
  });

  it("correctly calculates Byte16 internal value", () => {
    // Use a 16-byte array with zeros in the left half and a nonzero right half.
    const byteArray = [
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0xde, 0xad,
    ];

    const byte16Instance = Byte16.fromBytes(byteArray);
    // toField returns (left * 2^64) + right.
    // Here left=0 and right=0xdead.
    expect(byte16Instance.toField()).toEqual(Field(0xdead));
    expect(byte16Instance.toField()).toEqual(Field(57005));

    const byteArray2 = [
      0x21, 0xab, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0, 0x12, 0x34, 0x56,
      0x78, 0x9a, 0xbc, 0xff,
    ];

    const byte16Instance2 = Byte16.fromBytes(byteArray2);
    // toField returns (left * 2^64) + right.
    expect(byte16Instance2.toField().toBigInt().toString(16)).toEqual(
      "21ab3456789abcdef0123456789abcff",
    );
  });

  it("arranges bytes into 4 columns", () => {
    // Given our new interpretation, toColumns() returns:
    //   col0 = bytes[0..3] (from left half),
    //   col1 = bytes[4..7] (from left half),
    //   col2 = bytes[8..11] (from right half),
    //   col3 = bytes[12..15] (from right half).
    const byteArray = [
      0x01, 0xab, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0, 0x12, 0x34, 0x56,
      0x78, 0x9a, 0xbc, 0xff,
    ];
    const b16 = Byte16.fromBytes(byteArray);
    const cols = b16.toColumns();

    expect(cols[0]).toEqual([
      Field(0x01),
      Field(0xab),
      Field(0x34),
      Field(0x56),
    ]);
    expect(cols[1]).toEqual([
      Field(0x78),
      Field(0x9a),
      Field(0xbc),
      Field(0xde),
    ]);
    expect(cols[2]).toEqual([
      Field(0xf0),
      Field(0x12),
      Field(0x34),
      Field(0x56),
    ]);
    expect(cols[3]).toEqual([
      Field(0x78),
      Field(0x9a),
      Field(0xbc),
      Field(0xff),
    ]);
  });
});

describe("Byte16 assertEquals", () => {
  it("passes for two equal Byte16 instances", () => {
    const byteArray = [
      0x01, 0xab, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0, 0x12, 0x34, 0x56,
      0x78, 0x9a, 0xbc, 0xef,
    ];
    const a = Byte16.fromBytes(byteArray);
    const b = Byte16.fromBytes(byteArray);
    // Should not throw when asserting equality.
    expect(() => a.assertEquals(b)).not.toThrow();
  });

  it("throws for two non-equal Byte16 instances", () => {
    const bytesA = [
      0x01, 0xab, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0, 0x12, 0x34, 0x56,
      0x78, 0x9a, 0xbc, 0xef,
    ];
    const bytesB = [
      0x01, 0xab, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0, 0x12, 0x34, 0x56,
      0x78, 0x9a, 0xbd, 0xef,
    ];
    const a = Byte16.fromBytes(bytesA);
    const b = Byte16.fromBytes(bytesB);
    expect(() => a.assertEquals(b)).toThrow();
  });
});

describe("Byte16 xor", () => {
  it("computes the bitwise XOR of two Byte16 instances", () => {
    const bytesA = [
      0x01, 0xab, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0, 0x12, 0x34, 0x56,
      0x78, 0x9a, 0xbc, 0xef,
    ];
    const bytesB = [
      0xff, 0x00, 0xff, 0x00, 0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0x11, 0xee, 0x11,
      0x22, 0x33, 0x44, 0x55,
    ];
    // Manually compute expected XOR result per byte.
    const expected = bytesA.map((b, i) => b ^ bytesB[i]);
    const a = Byte16.fromBytes(bytesA);
    const b = Byte16.fromBytes(bytesB);
    const xorResult = Byte16.xor(a, b);
    const xorBytes = xorResult.toBytes();
    expect(xorBytes).toEqual(expected);
  });
});

describe("Byte16 fromColumns", () => {
  it("reconstructs Byte16 correctly from its columns", () => {
    // Use a known 16-byte array.
    const byteArray = [
      0x01, 0xab, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0, 0x12, 0x34, 0x56,
      0x78, 0x9a, 0xbc, 0xef,
    ];
    // Construct a Byte16 instance.
    const original = Byte16.fromBytes(byteArray);
    // Convert to columns.
    const cols = original.toColumns();
    // Reconstruct Byte16 from the columns.
    const reconstructed = Byte16.fromColumns(cols);
    // The reconstructed instance should equal the original.
    expect(() => original.assertEquals(reconstructed)).not.toThrow();
    expect(reconstructed.toBytes()).toEqual(byteArray);
  });
});

describe("Byte16 toHex and fromHex", () => {
  it("should correctly convert a hex string to a Byte16 instance and back", () => {
    // A valid 32-character hex string (16 bytes):
    // Left half: 01ab3456789abcde (columns 0–1)
    // Right half: f0123456789abcef (columns 2–3)
    const hex = "01ab3456789abcdef0123456789abcef";
    const byte16Instance = Byte16.fromHex(hex);
    const convertedHex = byte16Instance.toHex();
    expect(convertedHex).toBe(hex);
  });

  it("should throw an error if the hex string length is not 32 characters", () => {
    const shortHex = "0123456789abcdef";
    expect(() => Byte16.fromHex(shortHex)).toThrow(
      "Expected 32 characters in hex string.",
    );

    const longHex = "0123456789abcdef0123456789abcdef00";
    expect(() => Byte16.fromHex(longHex)).toThrow(
      "Expected 32 characters in hex string.",
    );
  });

  it("should correctly handle hex strings with uppercase letters", () => {
    const hexLower = "0123456789abcdef0123456789abcdef";
    const hexUpper = "0123456789ABCDEF0123456789ABCDEF";
    const byte16Lower = Byte16.fromHex(hexLower);
    const byte16Upper = Byte16.fromHex(hexUpper);
    expect(byte16Lower.toHex()).toBe(byte16Upper.toHex());
  });

  it("should contain correct internal representation after conversion", () => {
    const byteArray = [
      0x01, 0xab, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0, 0x12, 0x34, 0x56,
      0x78, 0x9a, 0xbc, 0xef,
    ];

    const byte16Instance = Byte16.fromBytes(byteArray);
    const hex = byte16Instance.toHex();
    // Expected hex: left half from bytes[0..7] then right half from bytes[8..15].
    expect(hex).toBe("01ab3456789abcdef0123456789abcef");

    const reconstructed = Byte16.fromHex(hex);
    expect(reconstructed.toBytes()).toEqual(byteArray);
  });
});

describe("Byte16 Zero", () => {
  it("should return a Byte16 instance with all zero bytes", () => {
    const zero = Byte16.Zero();
    const zeroValue = zero.toField();
    expect(zeroValue.toBigInt().toString(16)).toEqual("0");
  });
});

describe("Byte16 fromField and toField", () => {
  it("should correctly convert a Field to a Byte16 instance and back", () => {
    const field = Field(0xdeadbeef);
    const byte16Instance = Byte16.fromField(field);
    const convertedField = byte16Instance.toField();
    expect(convertedField).toEqual(field);

    const field2 = Field(0x123456789abcdef0n);
    const byte16Instance2 = Byte16.fromField(field2);
    const convertedField2 = byte16Instance2.toField();
    expect(convertedField2).toEqual(field2);
  });
});

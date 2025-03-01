import { Field } from "o1js";
import { Byte16 } from "../src/primitives/Bytes";

import { describe, it, expect } from "@jest/globals";

describe("Bytes", () => {
  it("Converts byte array to Byte16 instance and back", () => {
    // Example byte array
    const byteArray = [
      0x01, 0xab, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0, 0x12, 0x34, 0x56,
      0x78, 0x9a, 0xbc, 0xef,
    ];

    // Create Byte16 instance from byte array
    const byte16Instance = Byte16.fromBytes(byteArray);

    // Convert back to byte array
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
    const byteArray = [
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0xde, 0xad,
    ];

    const byte16Instance = Byte16.fromBytes(byteArray);
    expect(byte16Instance.toField()).toEqual(Field(0xdead));
    expect(byte16Instance.toField()).toEqual(Field(57005));
  });

  it("arranges bytes into 4 columns", () => {
    const byteArray = [
      0x01, 0xab, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0, 0x12, 0x34, 0x56,
      0x78, 0x9a, 0xbc, 0xff,
    ];

    const columns = Byte16.fromBytes(byteArray).toColumns();
    expect(columns[0]).toEqual([
      Field(0x01),
      Field(0x78),
      Field(0xf0),
      Field(0x78),
    ]);
    expect(columns[1]).toEqual([
      Field(0xab),
      Field(0x9a),
      Field(0x12),
      Field(0x9a),
    ]);
    expect(columns[2]).toEqual([
      Field(0x34),
      Field(0xbc),
      Field(0x34),
      Field(0xbc),
    ]);
    expect(columns[3]).toEqual([
      Field(0x56),
      Field(0xde),
      Field(0x56),
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
      0x01,
      0xab,
      0x34,
      0x56,
      0x78,
      0x9a,
      0xbc,
      0xde,
      0xf0,
      0x12,
      0x34,
      0x56,
      0x78,
      0x9a,
      0xbd,
      0xef, // note: one byte changed (0xbd instead of 0xbc)
    ];
    const a = Byte16.fromBytes(bytesA);
    const b = Byte16.fromBytes(bytesB);
    // Depending on your testing environment, assertEquals() may trigger an unsatisfied constraint.
    expect(() => a.assertEquals(b)).toThrow();
  });
});

describe("Byte16 toColumns", () => {
  it("correctly arranges the bytes into 4 columns", () => {
    const byteArray = [
      0x01,
      0xab,
      0x34,
      0x56, // top row (first 4 bytes)
      0x78,
      0x9a,
      0xbc,
      0xde, // next 4 bytes
      0xf0,
      0x12,
      0x34,
      0x56, // next 4 bytes
      0x78,
      0x9a,
      0xbc,
      0xff, // bottom 4 bytes
    ];
    const b16 = Byte16.fromBytes(byteArray);
    const cols = b16.toColumns();
    // The expected arrangement (based on the implementation) is as follows:
    // Each column is built by taking 2 bytes from the top part and 2 bytes from the bottom.
    // For example, column 0 is:
    //  - from top: extracted from this.top: first and third byte groups,
    //  - from bot: extracted similarly.
    // (Adjust these expected values if your Gadgets functions behave differently.)
    expect(cols[0]).toEqual([
      Field(0x01),
      Field(0x78),
      Field(0xf0),
      Field(0x78),
    ]);
    expect(cols[1]).toEqual([
      Field(0xab),
      Field(0x9a),
      Field(0x12),
      Field(0x9a),
    ]);
    expect(cols[2]).toEqual([
      Field(0x34),
      Field(0xbc),
      Field(0x34),
      Field(0xbc),
    ]);
    expect(cols[3]).toEqual([
      Field(0x56),
      Field(0xde),
      Field(0x56),
      Field(0xff),
    ]);
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
    // Also check the byte arrays are equal.
    expect(reconstructed.toBytes()).toEqual(byteArray);
  });
});

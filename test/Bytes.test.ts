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

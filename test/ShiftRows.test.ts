import { Byte16 } from "../src/primitives/Bytes";
import { shiftRows } from "../src/ShiftRows";

describe("ShiftRows", () => {
  it("test expected outcome of shiftRows", async () => {
    const input = Byte16.fromBytes([
      0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c,
      0x0d, 0x0e, 0x0f, 0x10,
    ]);
    const num = shiftRows(input);
    expect(num.toField().toBigInt().toString(16)).toEqual(
      "1020304060708050b0c090a100d0e0f",
    ); // quick hack for output in hex
  });
});

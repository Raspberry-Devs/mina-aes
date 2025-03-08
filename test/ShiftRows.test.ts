import { Byte16 } from "../src/primitives/Bytes";
import { shiftRows } from "../src/ShiftRows";

describe("ShiftRows", () => {
  // Taken from FIPS 197, Appendix A.1
  it("test expected outcome of shiftRows", async () => {
    const input = Byte16.fromBytes([
      0xd4, 0x27, 0x11, 0xae, 0xe0, 0xbf, 0x98, 0xf1, 0xb8, 0xb4, 0x5d, 0xe5,
      0x1e, 0x41, 0x52, 0x30,
    ]);
    const num = shiftRows(input);
    expect(num.toHex()).toEqual("d4bf5d30e0b452aeb84111f11e2798e5"); // quick hack for output in hex
  });
});

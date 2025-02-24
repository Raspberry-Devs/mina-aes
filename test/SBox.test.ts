import { Field } from "o1js";
import { Byte16 } from "../src/primitives/Bytes";
import { sbox } from "../src/SBox";

describe("SBox", () => {
  it("generates correct key for 2 bytes input", async () => {
    const input = Byte16.fromBytes([
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0xde, 0xad,
    ]);

    const num = sbox(input);
    expect(num.toField()).toEqual(Field(0x63636363636363636363636363631d95n));
  });

  it("generates correct key for 4 bytes input", async () => {
    const input = Byte16.fromBytes([
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0xde, 0xad, 0xbe, 0xef,
    ]);
    const num = sbox(input);
    expect(num.toField()).toEqual(Field(0x6363636363636363636363631d95aedfn));
  });

  it("generates correct key for 16 bytes input", async () => {
    const input = Byte16.fromBytes([
      0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c,
      0x0d, 0x0e, 0x0f, 0x10,
    ]);
    const num = sbox(input);
    expect(num.toField()).toEqual(Field(0x7c777bf26b6fc53001672bfed7ab76can));
  });
});

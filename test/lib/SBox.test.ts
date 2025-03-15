import { Field } from "o1js";
import { Byte16 } from "../../src/primitives/Bytes";
import { sbox, sboxByte } from "../../src/lib/SBox";
import { sbox_arr } from "../../src/utils/SBoxArr";

describe("SBox", () => {
  it("generates correct key for 2 bytes input", async () => {
    const input = Byte16.fromBytes([
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0xde, 0xad,
    ]);

    const num = sbox(input);
    expect(num.toHex()).toEqual("63636363636363636363636363631d95");
  });

  it("generates correct key for 4 bytes input", async () => {
    const input = Byte16.fromBytes([
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0xde, 0xad, 0xbe, 0xef,
    ]);
    const num = sbox(input);
    expect(num.toHex()).toEqual("6363636363636363636363631d95aedf");
  });

  it("generates correct key for 16 bytes input", async () => {
    const input = Byte16.fromBytes([
      0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c,
      0x0d, 0x0e, 0x0f, 0x10,
    ]);
    const num = sbox(input);
    expect(num.toHex()).toEqual("7c777bf26b6fc53001672bfed7ab76ca");
  });
});

describe("SBox Single Byte", () => {
  it("generates correct key for 1 byte input", () => {
    const input = Field(0x00);
    const num = sboxByte(input);
    expect(num.toBigInt()).toEqual(0x63n);

    const input2 = Field(0x01);
    const num2 = sboxByte(input2);
    expect(num2.toBigInt()).toEqual(0x7cn);
  });

  it("generates correct key with entire table", () => {
    for (let i = 0; i < 256; i++) {
      const input = Field(i);
      const num = sboxByte(input);
      expect(num.toBigInt()).toEqual(sbox_arr[i].toBigInt());
    }
  });
});

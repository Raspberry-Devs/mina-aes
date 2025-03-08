import { Field } from "o1js";
import { mixColumn, gmixColumn } from "../src/lib/MixColumns";
import { Byte16 } from "../src/primitives/Bytes";

describe("GMixColumns", () => {
  // Examples taken from: https://www.samiam.org/mix-column.html
  it("generates correct key for single column input", async () => {
    const input = [Field(0xdb), Field(0x13), Field(0x53), Field(0x45)];

    const num = gmixColumn(input);
    expect(num).toEqual([Field(0x8e), Field(0x4d), Field(0xa1), Field(0xbc)]);

    const input2 = [Field(0xf2), Field(0x0a), Field(0x22), Field(0x5c)];
    const num2 = gmixColumn(input2);
    expect(num2).toEqual([Field(0x9f), Field(0xdc), Field(0x58), Field(0x9d)]);

    const input3 = [Field(0x01), Field(0x01), Field(0x01), Field(0x01)];
    const num3 = gmixColumn(input3);
    expect(num3).toEqual([Field(0x01), Field(0x01), Field(0x01), Field(0x01)]);

    const input4 = [Field(0xc6), Field(0xc6), Field(0xc6), Field(0xc6)];
    const num4 = gmixColumn(input4);
    expect(num4).toEqual([Field(0xc6), Field(0xc6), Field(0xc6), Field(0xc6)]);

    const input5 = [Field(0xd4), Field(0xd4), Field(0xd4), Field(0xd5)];
    const num5 = gmixColumn(input5);
    expect(num5).toEqual([Field(0xd5), Field(0xd5), Field(0xd7), Field(0xd6)]);

    const input6 = [Field(0x2d), Field(0x26), Field(0x31), Field(0x4c)];
    const num6 = gmixColumn(input6);
    expect(num6).toEqual([Field(0x4d), Field(0x7e), Field(0xbd), Field(0xf8)]);
  });

  it("Generates correct key for whole matrix inputs", async () => {
    // Taken from FIPS 197 Appendix A.1
    const input = Byte16.fromBytes([
      0xd4, 0xbf, 0x5d, 0x30, 0xe0, 0xb4, 0x52, 0xae, 0xb8, 0x41, 0x11, 0xf1,
      0x1e, 0x27, 0x98, 0xe5,
    ]);
    const num = mixColumn(input);
    expect(num.toHex()).toEqual("046681e5e0cb199a48f8d37a2806264c");

    const input2 = Byte16.fromBytes([
      0x49, 0xdb, 0x87, 0x3b, 0x45, 0x39, 0x53, 0x89, 0x7f, 0x02, 0xd2, 0xf1,
      0x77, 0xde, 0x96, 0x1a,
    ]);

    const num2 = mixColumn(input2);
    expect(num2.toHex()).toEqual("584dcaf11b4b5aacdbe7caa81b6bb0e5");
  });
});

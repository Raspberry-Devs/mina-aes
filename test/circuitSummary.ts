import { ZkProgram, Field } from "o1js";
import {
  IterativeAes128,
  IterativeAES128PublicInput as AESPublicInput,
} from "../src/implementations/IterativeAES128.js";
import { addRoundKey } from "../src/lib/AddRoundKey.js";
import { mixColumn } from "../src/lib/MixColumns.js";
import { sbox, sbox_byte } from "../src/lib/SBox.js";
import { shiftRows } from "../src/lib/ShiftRows.js";
import { Byte16 } from "../src/primitives/Bytes.js";
import { expandKey128 } from "../src/lib/KeyExpansion.js";

const libZkProgram = ZkProgram({
  name: "aes-verify",
  publicInput: AESPublicInput,

  methods: {
    sbox: {
      privateInputs: [Byte16],
      async method(input: AESPublicInput) {
        sbox(input.cipher);
      },
    },
    mixColumns: {
      privateInputs: [Byte16],
      async method(input: AESPublicInput) {
        mixColumn(input.cipher);
      },
    },
    shiftRows: {
      privateInputs: [Byte16],
      async method(input: AESPublicInput) {
        shiftRows(input.cipher);
      },
    },
    addRoundKey: {
      privateInputs: [],
      async method(input: AESPublicInput) {
        addRoundKey(input.cipher, input.cipher);
      },
    },
    sboxByte: {
      privateInputs: [Field],
      async method(input_ignore: AESPublicInput, input: Field) {
        sbox_byte(input);
      },
    },
    expandKey128: {
      privateInputs: [Byte16],
      async method(input_ignore: AESPublicInput, input: Byte16) {
        expandKey128(input);
      },
    },
  },
});

const main = async () => {
  const { sboxByte, sbox, mixColumns, shiftRows, addRoundKey, expandKey128 } =
    await libZkProgram.analyzeMethods();
  const { verifyAES128 } = await IterativeAes128.analyzeMethods();

  console.log("AES128 Iterative Summary:");
  console.log(verifyAES128.summary());

  console.log("SBox Summary:");
  console.log(sbox.summary());

  console.log("SBoxByte Summary:");
  console.log(sboxByte.summary());

  console.log("MixColumns Summary:");
  console.log(mixColumns.summary());

  console.log("ShiftRows Summary:");
  console.log(shiftRows.summary());

  console.log("AddRoundKey Summary:");
  console.log(addRoundKey.summary());

  console.log("ExpandKey128 Summary:");
  console.log(expandKey128.summary());
};

main();

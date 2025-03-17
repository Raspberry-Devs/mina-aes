import { Poseidon } from "o1js";
import { Byte16 } from "../../../src/primitives/Bytes";
import { encryptAES128 } from "../../../src/utils/crypto";
import {
  AES128HelperPublicInput,
  CtrModeIterativeAes128Helper,
} from "../../../src/implementations/ctr/IterativeAES128CTR";

const RUN_ZK_TESTS = process.env.RUN_ZK_TESTS === "true";

describe("CtrModeIterativeAes128Helper zkProgram", () => {
  (RUN_ZK_TESTS ? it : it.skip)(
    "verifies correct AES-128 CTR encryption",
    async () => {
      // Use fixed 16-byte arrays for key and message.
      const keyBytes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
      const messageBytes = [
        16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1,
      ];
      const key = Byte16.fromBytes(keyBytes);
      const message = Byte16.fromBytes(messageBytes);

      // Compute the expected cipher and hashed key.
      const expectedCipher = encryptAES128(message.toHex(), key.toHex());
      const expectedHashedKey = Poseidon.hashPacked(Byte16, key);

      // Build the public input.
      const publicInput = new AES128HelperPublicInput({
        cipher: Byte16.fromHex(expectedCipher),
        message,
        hashed_key: expectedHashedKey,
      });

      // Calling the method should resolve without error.
      await expect(
        CtrModeIterativeAes128Helper.verifyAESCTRHelper(publicInput, key),
      ).resolves.not.toThrow();
    },
  );

  (RUN_ZK_TESTS ? it : it.skip)(
    "fails when the cipher is incorrect",
    async () => {
      const keyBytes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
      const messageBytes = [
        16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1,
      ];
      const key = Byte16.fromBytes(keyBytes);
      const message = Byte16.fromBytes(messageBytes);

      // Compute the expected cipher and then tamper with it.
      const expectedCipher = encryptAES128(message.toHex(), key.toHex());
      const wrongCipher = Byte16.xor(
        Byte16.fromHex(expectedCipher),
        Byte16.fromBytes(new Array(16).fill(0xff)),
      );
      const expectedHashedKey = Poseidon.hashPacked(Byte16, key);

      const publicInput = new AES128HelperPublicInput({
        cipher: wrongCipher,
        message,
        hashed_key: expectedHashedKey,
      });

      await expect(
        CtrModeIterativeAes128Helper.verifyAESCTRHelper(publicInput, key),
      ).rejects.toThrow();
    },
  );

  (RUN_ZK_TESTS ? it : it.skip)(
    "fails when the hashed key is incorrect",
    async () => {
      const keyBytes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
      const messageBytes = [
        16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1,
      ];
      const key = Byte16.fromBytes(keyBytes);
      const message = Byte16.fromBytes(messageBytes);

      // Compute expected cipher.
      const expectedCipher = encryptAES128(message.toHex(), key.toHex());
      // Use a different key to compute a wrong hash.
      const wrongKey = Byte16.fromBytes(keyBytes.map((b) => b + 1));
      const wrongHashedKey = Poseidon.hashPacked(Byte16, wrongKey);

      const publicInput = new AES128HelperPublicInput({
        cipher: Byte16.fromHex(expectedCipher),
        message,
        hashed_key: wrongHashedKey,
      });

      await expect(
        CtrModeIterativeAes128Helper.verifyAESCTRHelper(publicInput, key),
      ).rejects.toThrow();
    },
  );
});

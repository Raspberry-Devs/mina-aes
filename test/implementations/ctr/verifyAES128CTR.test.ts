import { Field, Poseidon, VerificationKey, ZkProgram } from "o1js";
import { Byte16 } from "../../../src/primitives/Bytes";
import { encryptAES128 } from "../../../src/utils/crypto";
import {
  AES128HelperPublicInput,
  CtrModeIterativeAes128Helper,
  SideLoadedAESProof,
  verifyIterativeCounterMode,
} from "../../../src/implementations/ctr/IterativeAES128CTR";

/**
 * Helper to create a dummy proof.
 * Since verifyIterativeCounterMode calls proof.verify(vk),
 * we create a dummy verify that simply does nothing.
 */
function createDummyProof(
  publicInput: AES128HelperPublicInput,
): SideLoadedAESProof {
  return {
    publicInput,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    verify: (_: VerificationKey) => {
      /* dummy verification – assumes proof is valid */
    },
  } as unknown as SideLoadedAESProof;
}

const fakeZKProgram = ZkProgram({
  name: "aes-fake",
  publicInput: AES128HelperPublicInput,

  methods: {
    verifyAESCTRHelper: {
      privateInputs: [Byte16],

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async method(input: AES128HelperPublicInput, key: Byte16) {
        Field(0).assertEquals(Field(0));
      },
    },
  },
});

describe("verifyIterativeCounterMode", () => {
  it("verifies valid iterative counter mode proofs w dummy", () => {
    // Use fixed key and IV.
    const keyBytes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
    const key = Byte16.fromBytes(keyBytes);
    const hashKey = Poseidon.hashPacked(Byte16, key);
    const iv = Field(100); // arbitrary starting IV

    const numBlocks = 2;
    const proofs: SideLoadedAESProof[] = [];
    const ciphers: Byte16[] = [];
    const messages: Byte16[] = [];

    for (let i = 0; i < numBlocks; i++) {
      // Compute the expected counter input for block i.
      const counterField = iv.add(Field(i));
      const ctrInput = Byte16.fromField(counterField);
      // For testing, choose an arbitrary cipher value (this would be the output of AES for the counter).
      const cipherBytes = new Array(16)
        .fill(0)
        .map((_, j) => (i + j + 1) % 256);
      const ctrCipher = Byte16.fromBytes(cipherBytes);

      // Choose an arbitrary message (the “plaintext” of the block).
      const messageBytes = new Array(16)
        .fill(0)
        .map((_, j) => ((i + 1) * (j + 1)) % 256);
      const messageVal = Byte16.fromBytes(messageBytes);

      // In the verification, the expected relation is:
      // message = Byte16.xor(ciphers[i], ctrCipher)
      // Hence, set ciphers[i] such that:
      // ciphers[i] = Byte16.xor(message, ctrCipher)
      const cipherForBlock = Byte16.xor(messageVal, ctrCipher);

      // Build the public input for this block.
      const publicInput = new AES128HelperPublicInput({
        message: ctrInput, // the counter value (as Byte16)
        cipher: ctrCipher,
        hashed_key: hashKey,
      });

      proofs.push(createDummyProof(publicInput));
      ciphers.push(cipherForBlock);
      messages.push(messageVal);
    }

    // This call should pass (i.e. not throw) because all relations hold.
    expect(() =>
      verifyIterativeCounterMode(proofs, ciphers, messages, key, iv),
    ).not.toThrow();
  });

  it("throws error when a proof has an incorrect counter input w dummy", () => {
    const keyBytes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
    const key = Byte16.fromBytes(keyBytes);
    const hashKey = Poseidon.hashPacked(Byte16, key);
    const iv = Field(100);

    const proofs: SideLoadedAESProof[] = [];
    const ciphers: Byte16[] = [];
    const messages: Byte16[] = [];

    // Block 0: valid proof.
    {
      const counterField = iv.add(Field(0));
      const ctrInput = Byte16.fromField(counterField);
      const cipherBytes = new Array(16)
        .fill(0)
        .map((_, j) => (0 + j + 1) % 256);
      const ctrCipher = Byte16.fromBytes(cipherBytes);
      const messageBytes = new Array(16)
        .fill(0)
        .map((_, j) => ((0 + 1) * (j + 1)) % 256);
      const messageVal = Byte16.fromBytes(messageBytes);
      const cipherForBlock = Byte16.xor(messageVal, ctrCipher);

      const publicInput = new AES128HelperPublicInput({
        message: ctrInput,
        cipher: ctrCipher,
        hashed_key: hashKey,
      });
      proofs.push(createDummyProof(publicInput));
      ciphers.push(cipherForBlock);
      messages.push(messageVal);
    }

    // Block 1: invalid proof – use a wrong counter (e.g. iv.add(2) instead of iv.add(1)).
    {
      const counterField = iv.add(Field(2)); // incorrect counter!
      const ctrInput = Byte16.fromField(counterField);
      const cipherBytes = new Array(16)
        .fill(0)
        .map((_, j) => (1 + j + 1) % 256);
      const ctrCipher = Byte16.fromBytes(cipherBytes);
      const messageBytes = new Array(16)
        .fill(0)
        .map((_, j) => ((1 + 1) * (j + 1)) % 256);
      const messageVal = Byte16.fromBytes(messageBytes);
      const cipherForBlock = Byte16.xor(messageVal, ctrCipher);

      const publicInput = new AES128HelperPublicInput({
        message: ctrInput,
        cipher: ctrCipher,
        hashed_key: hashKey,
      });
      proofs.push(createDummyProof(publicInput));
      ciphers.push(cipherForBlock);
      messages.push(messageVal);
    }

    // Because the second proof’s counter is off, the relation
    // message = Byte16.xor(ciphers[i], ctrCipher) (with expected ctrInput)
    // will fail and verifyIterativeCounterMode should throw.
    expect(() =>
      verifyIterativeCounterMode(proofs, ciphers, messages, key, iv),
    ).toThrow();
  });

  it("verifies valid iterative counter mode proofs", async () => {
    const keyBytes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
    const key = Byte16.fromBytes(keyBytes);
    const hashKey = Poseidon.hashPacked(Byte16, key);
    const iv = "00000000000000000000000000000001";

    // Generate two proofs for two blocks.
    const numBlocks = 2;
    const proofs: SideLoadedAESProof[] = [];
    const ciphers: Byte16[] = [];
    const messages: Byte16[] = [
      Byte16.fromHex("0123456789abcdef0123456789abcdef"),
      Byte16.fromHex("fedcba9876543210fedcba9876543210"),
    ];

    for (let i = 0; i < numBlocks; i++) {
      const counterField = Field(iv).add(Field(i));
      const ctrInput = Byte16.fromField(counterField);

      const cipherBytes = encryptAES128(ctrInput.toHex(), key.toHex());

      const input = new AES128HelperPublicInput({
        message: ctrInput,
        hashed_key: hashKey,
        cipher: Byte16.fromHex(cipherBytes),
      });

      // Generate proof
      const { proof } = await CtrModeIterativeAes128Helper.verifyAESCTRHelper(
        input,
        key,
      );

      ciphers.push(Byte16.xor(Byte16.fromHex(cipherBytes), messages[i]));
      proofs.push(SideLoadedAESProof.fromProof(proof));
    }

    expect(() =>
      verifyIterativeCounterMode(proofs, ciphers, messages, key, Field(iv)),
    ).not.toThrow();
  });

  it("fails on invalid iterative counter mode proofs", async () => {
    const keyBytes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
    const key = Byte16.fromBytes(keyBytes);
    const hashKey = Poseidon.hashPacked(Byte16, key);
    const iv = "00000000000000000000000000000001";

    const messages: Byte16[] = [
      Byte16.fromHex("0123456789abcdef0123456789abcdef"),
    ];

    const counterField = Field(iv).add(Field(0));
    const ctrInput = Byte16.fromField(counterField);

    const cipherBytes = encryptAES128(ctrInput.toHex(), key.toHex());

    const input = new AES128HelperPublicInput({
      message: ctrInput,
      hashed_key: hashKey,
      cipher: Byte16.fromHex(cipherBytes),
    });

    // Generate proof
    await fakeZKProgram.compile();
    const { proof } = await fakeZKProgram.verifyAESCTRHelper(input, key);

    const cipher = Byte16.xor(Byte16.fromHex(cipherBytes), messages[0]);

    const proofs = [SideLoadedAESProof.fromProof(proof)];
    const ciphers = [cipher];

    expect(() =>
      verifyIterativeCounterMode(proofs, ciphers, messages, key, Field(iv)),
    ).toThrow();
  });
});

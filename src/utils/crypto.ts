import crypto from "crypto";

/**
 * Encrypts a message using AES-128 encryption.
 *
 * @param messageHex Plaintext in hex form to encrypt
 * @param keyHex Key in hex form to use for encryption
 * @returns The encrypted message in hex form
 */
export function encryptAES128(messageHex: string, keyHex: string): string {
  const keyBuffer = Buffer.from(keyHex, "hex");
  const plaintextBuffer = Buffer.from(messageHex, "hex");
  const cipher = crypto.createCipheriv("aes-128-ecb", keyBuffer, null);
  cipher.setAutoPadding(false);
  const nodeEncrypted = Buffer.concat([
    cipher.update(plaintextBuffer),
    cipher.final(),
  ]);
  return nodeEncrypted.toString("hex");
}

/**
 * Encrypts a message using AES-128 encryption with CTR Mode.
 *
 * @param messageHex Plaintext in hex form to encrypt
 * @param keyHex Key in hex form to use for encryption
 * @returns The encrypted message in hex form
 */
export function encryptAES128CTR(
  messageHex: string,
  keyHex: string,
  iv: string,
): string {
  const keyBuffer = Buffer.from(keyHex, "hex");
  const plaintextBuffer = Buffer.from(messageHex, "hex");
  const cipher = crypto.createCipheriv("aes-128-ctr", keyBuffer, iv);
  cipher.setAutoPadding(false);
  const nodeEncrypted = Buffer.concat([
    cipher.update(plaintextBuffer),
    cipher.final(),
  ]);
  return nodeEncrypted.toString("hex");
}

/**
 * Converts a string to its hex representation.
 *
 * @param str The string to convert to hex
 * @returns The hex representation of the string
 */
export function stringToHex(str: string): string {
  return Buffer.from(str).toString("hex");
}

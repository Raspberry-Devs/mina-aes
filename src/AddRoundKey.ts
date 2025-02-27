import { Byte16 } from "./primitives/Bytes.js";

export function addRoundKey(input: Byte16, key: Byte16): Byte16 {
  return Byte16.xor(input, key);
}

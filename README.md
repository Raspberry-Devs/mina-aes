# Mina AES

A provable AES-128 implementation using [o1js](https://docs.minaprotocol.com/zkapps/o1js).

## Table of Contents

- [Summary](#summary)
- [Features](#features)
- [Installation](#installation)
- [Build](#build)
- [Formatting and Linting](#formatting-and-linting)
- [Testing](#testing)
- [Circuit Breakdown](#circuit-breakdown)
- [Contributing](#contributing)
- [License](#license)
- [Additional Information](#additional-information)

## Summary
Mina AES is a community-driven AES-128 implementation built with [o1js](https://docs.minaprotocol.com/zkapps/o1js). It offers a verifiable approach to symmetric encryption, with documentation available [here](https://scaraven.github.io/mina-aes/).

This work was spawned from the Mina Grant Starter Program and aims to provide a provable AES implementation, enabling users to generate proofs that they have encrypted or decrypted texts with a corresponding key (which is kept secret).

## Features

- AES-128 encryption
- Static and dynamic message sizes

## Installation and Quick Start

### Installation

```shell
npm ci
```

### Build

```shell

npm run build
npm run start
```

Or if you want to use the dev build

```shell
npm run dev
```

### Formatting and Linting

```
npm run lint
npm run format
```

### Testing

Unit tests:

```
npm run test
```

If you want to test zk programs locally as well:

```
npm run test:zk
```

To run a summary of constraints in all library functions:

```
npm run build
node ./build/test/circuitSummary.js
```

## Code Breakdown
The main entrypoint of the code is contained within `src/implementations/IterativeAES128.ts` which has the following implemented.
    - `IterativeAes128` is responsible for verifying that a cipher has been encrypted using AES with an arbitrary key and message
    - `IterativeAes128MessagePublic` is responsible for verifying that a cipher **and** a message have been encrypted using AES with an arbitrary key.
    - `computeIterativeAes128Encryption()` which can be inlined within circuits in order to proof AES encryption.

Additionally, `Byte16` is used to represent 256-bit numbers and is commonly used as inputs to functions and circuits.

### Why is there no decryption function?!
The beauty of verifying AES with zk-proofs is that decryption and encryption can both be done with "encryption" under the hood. For example, if you wanted to build a function `AESDecrypt()` using `computeIterativeAes128Encryption()` then you can use witnesses as follows:
```typescript
function decrypt(key: Byte16, cipher: Byte16) {
    const plaintext = Provable.witness(Byte16, () => {YOUR_OUT_OF_CIRCUIT_FUNCTION_DECRYPTION_HERE});
    const cipher_internal = computeIterativeAes128Encryption(plaintext, key);
    cipher_internal.assertEquals(cipher);

    return cipher
}
```

The main reason why we didn't explicitly create AES decryption is twofold. Foremost, decreasing the amount of code implemented decreases the attack surface for vulnerabilities and bugs. Additionally, AES decryption requires more constraints due to `MixColumns` and `SBox` operations becoming slightly more expensive. 

## Circuit Breakdown

### AES128 Iterative Summary

| Key          | Value  |
| ------------ | ------ |
| Total rows   | 50185  |
| Generic      | 18617  |
| Xor16        | 10984  |
| Zero         | 10984  |
| Rot64        | 4800   |
| RangeCheck0  | 4800   |

# Contributing
Everyone is welcome to contribute, file an issue or submit a pull request if you think there is something worth mentioning.

# License
This project is licensed under the Apache 2.0 License.

### Additional Information
Note that although this code has been tested for correctness, no official audit has been performed to test for implementation vulnerabilities. Please do be careful if using this in your applications.

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
- Counter Mode (CTR)
- Galois Counter Mode (GCM) (coming soon)

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

### Core:
- Implementing block mode: **Counter Mode (CTR)**.

### Optional:

- User authentication block mode: **Galois Counter Mode (GCM)**.

# Contributing
Everyone is welcome to contribute, file an issue or submit a pull request if you think there is something worth mentioning.

# License
This project is licensed under the Apache 2.0 License.

### Additional Information
Note that although this code has been tested for correctness, no official audit has been performed to test for implementation vulnerabilities. Please do be careful if using this in your applications.

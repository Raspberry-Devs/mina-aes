# Mina AES

A provable AES implementation using o1js

## Summary
This is a provable AES-128 implementation using [o1js](https://docs.minaprotocol.com/zkapps/o1js). Documentation can be found [here](https://scaraven.github.io/mina-aes/).
The repository includes static fixed 128bit message sizes as well as dynamic message sizes with CTR mode of operation (GCM soon to come).

AES (Advanced Encryption Standard) is a symmetric encryption scheme as defind [here](https://csrc.nist.gov/pubs/fips/197/final).

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

### Additional Information
Note that although this code has been tested for correctness, no official audit has been performed to test for implementation vulnerabilities. Please do be careful if using this in your applications.

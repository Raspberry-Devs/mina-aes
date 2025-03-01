import { Field, SelfProof, Struct, ZkProgram } from "o1js";
import { Byte16 } from "../primitives/Bytes.js";
import { shiftRows } from "../ShiftRows.js";
import { sbox } from "../SBox.js";
import { mixColumn } from "../MixColumns.js";
import { addRoundKey } from "../AddRoundKey.js";

const NUM_ROUNDS = 10;

class RecursiveAES128PublicInput extends Struct({
  round: Field,
  state: Byte16,
}) {}

// TODO: ADD KEY EXPANSIONs
const RecursiveAes128 = ZkProgram({
  name: "aes-verify-recursive",
  publicInput: RecursiveAES128PublicInput,

  methods: {
    addRoundKey: {
      privateInputs: [Byte16, Byte16],
      async method(
        input: RecursiveAES128PublicInput,
        message: Byte16,
        roundKey: Byte16,
      ) {
        input.round.assertEquals(Field(0));
        const state = addRoundKey(message, roundKey);
        state.assertEquals(input.state);
      },
    },

    mainRound: {
      privateInputs: [SelfProof<RecursiveAES128PublicInput, void>, Byte16],
      async method(
        input: RecursiveAES128PublicInput,
        previousProof: SelfProof<RecursiveAES128PublicInput, void>,
        roundKey: Byte16,
      ) {
        previousProof.verify();
        const prevState = previousProof.publicInput.state;
        const prevRound = previousProof.publicInput.round;

        input.round.assertEquals(prevRound.add(1));

        let state = sbox(prevState);
        state = shiftRows(state);
        state = mixColumn(state);

        state = addRoundKey(state, roundKey);
        state.assertEquals(input.state);
      },
    },

    finalRound: {
      privateInputs: [SelfProof<RecursiveAES128PublicInput, void>, Byte16],
      async method(
        input: RecursiveAES128PublicInput,
        previousProof: SelfProof<RecursiveAES128PublicInput, void>,
        roundKey: Byte16,
      ) {
        previousProof.verify();
        const prevState = previousProof.publicInput.state;
        const prevRound = previousProof.publicInput.round;

        input.round.assertEquals(prevRound.add(1));
        input.round.assertEquals(Field(NUM_ROUNDS));

        let state = sbox(prevState);
        state = shiftRows(state);
        state = addRoundKey(state, roundKey);
        state.assertEquals(input.state);
      },
    },
  },
});

export { RecursiveAes128, RecursiveAES128PublicInput };

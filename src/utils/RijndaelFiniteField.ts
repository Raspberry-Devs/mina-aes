import { createForeignField, Field, Gadgets } from "o1js";
import { Field3 } from "o1js/dist/node/lib/provable/gadgets/foreign-field";

const RIJNDAEL_FINITE_SIZE = 256n;
const FIELD3_SIZE = 3;
const XOR_CONSTRAINT = 8;

class RijndaelFiniteField extends createForeignField(RIJNDAEL_FINITE_SIZE) {
  // Override the multiplication method
  mult(other: RijndaelFiniteField): RijndaelFiniteField {
    // ...implementation...
    return other;
  }

  // Override the addition method
  add(other: RijndaelFiniteField): RijndaelFiniteField {
    // Addition in Rijndael's field is equivalent to bitwise XOR
    return RijndaelFiniteField.xor(this, other);
  }

  // Override the division method (finding the inverse and multiplying)
  div(other: RijndaelFiniteField): RijndaelFiniteField {
    return this.mult(other.inverse());
  }

  // Method for finding the inverse
  inverse(): RijndaelFiniteField {
    // ...implementation...
    return new RijndaelFiniteField(0n);
  }

  static xor(
    a: RijndaelFiniteField,
    b: RijndaelFiniteField,
  ): RijndaelFiniteField {
    // This is a bitwise XOR operation
    // Fetch underlying fields
    const aField = a.toFields();
    const bField = b.toFields();

    const cField: Field[] = [];

    // Perform XOR operation on each field
    for (let i = 0; i < FIELD3_SIZE; i++) {
      // Each limb cannot be larger than 8 bits
      cField.push(Gadgets.xor(aField[i], bField[i], XOR_CONSTRAINT));
    }

    // Convert into Field3
    const fField: Field3 = [cField[0], cField[1], cField[2]];

    return new RijndaelFiniteField(fField);
  }
}

export { RijndaelFiniteField };


import {MULTIPLICATION_TABLE} from "../inc/cube-algebra";
import {LATEX_GREEK_LETTERS, ORIENTATION_GREEK_LETTER_ORDER} from "../inc/greek-letters";



const i24 = Array(24).fill(null).map((_, i) => i);

const ORIENTATION_INDICES = i24.map(i => ORIENTATION_GREEK_LETTER_ORDER.indexOf(i));

const INDEX_TABLE = i24.map(j => i24.map(i => ORIENTATION_GREEK_LETTER_ORDER[MULTIPLICATION_TABLE[ORIENTATION_INDICES[i]][ORIENTATION_INDICES[j]]]));
const LETTERS_TABLE = INDEX_TABLE.map(line => line.map(i => LATEX_GREEK_LETTERS[i]));

const text = LETTERS_TABLE.map((line, j) => `\\boldsymbol{${LATEX_GREEK_LETTERS[j]}} & ` + line.join(" & ")).join(" \\\\\\\\\n");
const head = LATEX_GREEK_LETTERS.map(letter => `\\boldsymbol{${letter}}`).join(" & ") + " \\\\\\\\\n";

console.log(head);
console.log(text);

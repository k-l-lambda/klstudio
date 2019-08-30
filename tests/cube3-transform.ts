
import * as cube3 from "../inc/cube3";
import { cubePartitionCode } from "../inc/cube3-partition";



const neighbors = cube => Array(12).fill(null).map((_, t) => cubePartitionCode(cube.clone().twist(t)));


const cube = new cube3.Cube3({code: "KCKABCBACKAABCBACBAAACBAAA"});
const n0 = neighbors(cube);
const trans = Array(48).fill(null).map((_, i) => cube.clone().transform(i));
const ns = trans.map(c => neighbors(c));
const n0ps = cube3.TWIST_PERMUTATION_48.map(p => cube3.permutate(p, n0));
const n0ds = cube3.TWIST_PERMUTATION_48.map(p => cube3.depermutate(p, n0));


console.table(Array(48).fill(null).map((_, i) => [ns[i].toString(), n0ps[i].toString()]));


setTimeout(x => x, 0x7fffffff);

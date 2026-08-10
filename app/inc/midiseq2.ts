
/**
 * midiseq2 text (.midiseq2.txt) -> MIDI data, via the jison grammar generated in intelli-piano.
 *
 * The grammar's action code does the whole decode, so this is only a typed entry point. `@measure`
 * and `@tick` are control directives: they land on the events as `measureIndex` / `tickInMeasure`
 * and are never encoded into MIDI bytes, so a player simply ignores them.
 */

// @ts-ignore -- generated parser, shipped without typings.
import * as grammar from "./midiseq2.jison.js";


export const midiseq2ToMidi = (source: string): any => (grammar as any).parse(source);


/** midiseq2 files are plain text; the double extension is what distinguishes them from MidiText. */
export const isMidiseq2Name = (name: string): boolean => /\.midiseq2\.txt$/i.test(name);

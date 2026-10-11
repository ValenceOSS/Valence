const ARRAYS_AT = 22;

/**
 * Every NAL unit an H.265 configuration record (`hvcC`) carries, in the order it lists them.
 *
 * @param record - The record.
 * @returns Its NAL units, or none where it cannot be read.
 */
const nalsOfRecord = (record: Uint8Array): Uint8Array[] => {
  const units: Uint8Array[] = [];
  let at = ARRAYS_AT + 1;

  for (let array = 0; array < (record[ARRAYS_AT] ?? 0); array += 1) {
    const count = ((record[at + 1] ?? 0) << 8) | (record[at + 2] ?? 0);

    at += 3;

    for (let unit = 0; unit < count; unit += 1) {
      const length = ((record[at] ?? 0) << 8) | (record[at + 1] ?? 0);

      units.push(record.subarray(at + 2, at + 2 + length));
      at += 2 + length;
    }
  }

  return units;
};

export { nalsOfRecord };

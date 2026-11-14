const ASS_TIMESTAMP = /^(\d+):(\d{2}):(\d{2})[.:](\d{1,3})$/;

/**
 * Reads an Advanced SubStation timestamp as a number of seconds. That format counts hundredths
 * rather than thousandths and pads nothing, so `0:00:01.5` means a second and a half; a script
 * written by a tool that counts thousandths is read the same way.
 *
 * @param value - The timestamp as the script wrote it.
 * @returns The position in seconds, or null where the line was not a timestamp at all.
 */
const readAssTimestamp = (value: string): number | null => {
  const match = ASS_TIMESTAMP.exec(value.trim());

  if (match === null) {
    return null;
  }

  const [, hours = '0', minutes = '0', seconds = '0', fraction = '0'] = match;

  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds) + Number(`0.${fraction}`);
};

export { readAssTimestamp };

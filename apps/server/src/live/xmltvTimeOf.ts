const XMLTV_TIME = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?\s*([+-]\d{4})?/u;

/**
 * Reads an XMLTV time, such as `20261011193000 +0100`, as the moment it names. A time with no
 * offset is taken as UTC, as the format says it is.
 *
 * @param text - The time as the guide writes it.
 * @returns The moment, or nothing where it is not one.
 */
const xmltvTimeOf = (text: string): Date | null => {
  const found = XMLTV_TIME.exec(text.trim());

  if (found === null) {
    return null;
  }

  const [, year, month, day, hour, minute, second, offset] = found;
  const offsetMinutes =
    offset === undefined
      ? 0
      : (offset.startsWith('-') ? -1 : 1) *
        (Number(offset.slice(1, 3)) * 60 + Number(offset.slice(3, 5)));
  const utc = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second ?? '0'),
  );
  const moment = new Date(utc - offsetMinutes * 60_000);

  return Number.isNaN(moment.getTime()) ? null : moment;
};

export { xmltvTimeOf };

const GUARDED = /^'[=+\-@\t\r]/u;

/**
 * Reads a spreadsheet saved as comma-separated values into its rows of cells: quoted cells may hold
 * commas, quotes written twice and new lines, and a cell an export guarded against being run as a
 * formula, by an apostrophe before it, is read without the apostrophe.
 *
 * @param text - The file's text.
 * @returns Its rows, each a list of cells, with no empty rows.
 */
const rowsOfCsv = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let isQuoted = false;
  const keep = () => {
    row.push(GUARDED.test(cell) ? cell.slice(1) : cell);
    cell = '';
  };

  for (let at = 0; at < text.length; at += 1) {
    const letter = text[at] ?? '';

    if (isQuoted) {
      if (letter === '"' && text[at + 1] === '"') {
        cell += '"';
        at += 1;
      } else if (letter === '"') {
        isQuoted = false;
      } else {
        cell += letter;
      }
    } else if (letter === '"' && cell === '') {
      isQuoted = true;
    } else if (letter === ',') {
      keep();
    } else if (letter === '\n' || letter === '\r') {
      if (letter === '\r' && text[at + 1] === '\n') {
        at += 1;
      }

      keep();
      rows.push(row);
      row = [];
    } else {
      cell += letter;
    }
  }

  if (cell !== '' || row.length > 0) {
    keep();
    rows.push(row);
  }

  return rows.filter((one) => one.some((value) => value !== ''));
};

export { rowsOfCsv };

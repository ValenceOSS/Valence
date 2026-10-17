type AuditPlace = {
  at: Date;
  id: string;
};

const SEPARATOR = '_';

/**
 * Writes where a page of the audit log ended, as something opaque to hand back for the next page.
 *
 * @param place - The last entry on the page.
 * @returns The cursor.
 */
const writeAuditCursor = (place: AuditPlace): string =>
  `${place.at.getTime().toString()}${SEPARATOR}${place.id}`;

/**
 * Reads back where a page of the audit log ended.
 *
 * @param cursor - What `writeAuditCursor` wrote.
 * @returns Where to carry on from, or null where it cannot be read.
 */
const readAuditCursor = (cursor: string): AuditPlace | null => {
  const split = cursor.indexOf(SEPARATOR);
  const at = Number(cursor.slice(0, split));
  const id = cursor.slice(split + 1);

  return split <= 0 || !Number.isFinite(at) || id === '' ? null : { at: new Date(at), id };
};

export type { AuditPlace };

export { readAuditCursor, writeAuditCursor };

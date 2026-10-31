/**
 * The key one person's answer for one of a plugin's home rows is kept under, among that plugin's.
 *
 * @param rowId - The row.
 * @param profileId - Whose row it is.
 * @returns The key.
 */
const homeRowKey = (rowId: string, profileId: string): string => JSON.stringify([rowId, profileId]);

export { homeRowKey };

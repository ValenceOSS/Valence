/**
 * Reads SQL built for any database with its identifiers quoted the way Postgres quotes them, so a
 * test can say which columns a query names once, whichever database it was built for.
 *
 * @param text - The SQL.
 * @returns The same SQL, with MySQL's backticks written as double quotes.
 */
const sqlAsPostgresQuotes = (text: string): string => text.replaceAll('`', '"');

export { sqlAsPostgresQuotes };

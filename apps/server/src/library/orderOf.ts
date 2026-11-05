/**
 * Says which of the catalogue's orders a programme's episodes are numbered in, for describing one
 * of its files.
 *
 * @param orders - The order chosen for each programme, by its catalogue id.
 * @param externalId - The programme the file is matched to, or nothing.
 * @returns The order to describe it by, or nothing for the catalogue's own.
 */
const orderOf = (
  orders: ReadonlyMap<string, string>,
  externalId: string | null,
): { episodeOrder?: string } => {
  const order = externalId === null ? undefined : orders.get(externalId);

  return order === undefined ? {} : { episodeOrder: order };
};

export { orderOf };

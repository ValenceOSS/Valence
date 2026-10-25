/**
 * Takes something off this viewer's continue watching until they next watch it, or puts it back.
 *
 * @param mediaId - The film or episode on the row.
 * @param isDismissed - Whether it should be off the row.
 * @returns Whether the server agreed.
 */
const setDismissed = async (mediaId: string, isDismissed: boolean): Promise<boolean> => {
  const response = await fetch(`/api/media/${mediaId}/dismissed`, {
    method: isDismissed ? 'PUT' : 'DELETE',
    credentials: 'same-origin',
  }).catch(() => null);

  return response !== null && response.ok;
};

export { setDismissed };

/**
 * Saves the fanart.tv key a title's extra posters, backgrounds and logos are read with. Without one
 * the artwork chooser offers the catalogue's alone.
 *
 * @param fanartKey - The key.
 * @returns Whether it was written.
 */
const saveFanartKey = async (fanartKey: string): Promise<boolean> => {
  const response = await fetch('/api/admin/settings', {
    method: 'PATCH',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ fanartKey }),
  }).catch(() => null);

  return response !== null && response.ok;
};

export { saveFanartKey };

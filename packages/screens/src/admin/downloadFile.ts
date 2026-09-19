/**
 * Hands the reader a file the page already holds, under the name given.
 *
 * @param name - What to call the file.
 * @param file - What goes in it.
 */
const downloadFile = (name: string, file: Blob): void => {
  const address = URL.createObjectURL(file);
  const link = document.createElement('a');

  link.href = address;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(address);
};

export { downloadFile };

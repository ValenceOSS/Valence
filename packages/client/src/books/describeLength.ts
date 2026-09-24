/**
 * Says how long something lasts in hours and minutes, the way a person would round it.
 *
 * @param seconds - How long it lasts.
 * @returns The words, such as "2 h 5 min", and never less than a minute.
 */
const describeLength = (seconds: number): string => {
  const minutes = Math.max(Math.round(seconds / 60), 1);
  const hours = Math.floor(minutes / 60);
  const over = minutes % 60;

  if (hours === 0) {
    return `${minutes.toString()} min`;
  }

  return over === 0 ? `${hours.toString()} h` : `${hours.toString()} h ${over.toString()} min`;
};

export { describeLength };

/**
 * The moment a title is said to have been added on a day an administrator gave, midday on that day
 * in UTC so it reads as that day wherever the server and the viewer are.
 *
 * @param day - The day, as YYYY-MM-DD.
 * @returns The moment.
 */
const addedAtOfDay = (day: string): Date => new Date(`${day}T12:00:00.000Z`);

export { addedAtOfDay };

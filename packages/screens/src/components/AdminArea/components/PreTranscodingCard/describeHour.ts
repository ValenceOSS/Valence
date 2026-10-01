/**
 * An hour of the day as a clock shows it, such as 01:00.
 *
 * @param hour - The hour, nought to twenty-three.
 * @returns The hour on a twenty-four hour clock.
 */
const describeHour = (hour: number): string => `${hour.toString().padStart(2, '0')}:00`;

export { describeHour };

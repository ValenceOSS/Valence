/**
 * Names the people of a catalogue's crew who did one kind of job, such as directing, each once and
 * in the catalogue's order.
 *
 * @param crew - The crew, each with their job.
 * @param isWanted - Whether a job counts.
 * @returns Their names.
 */
const namesOfJobs = (
  crew: readonly { name: string; job?: string | undefined }[],
  isWanted: (job: string) => boolean,
): string[] => [
  ...new Set(
    crew.filter((one) => one.job !== undefined && isWanted(one.job)).map((one) => one.name),
  ),
];

export { namesOfJobs };

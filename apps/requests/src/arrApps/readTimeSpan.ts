const TIME_SPAN =
  /^(?:(?<days>\d+)\.)?(?<hours>\d+):(?<minutes>\d{2}):(?<seconds>\d{2})(?:\.\d+)?$/u;

/**
 * Reads a .NET time span as Radarr, Sonarr and Lidarr write how long a download has left, such as
 * `1.02:03:04` or `00:10:00`, into seconds.
 *
 * @param text - The time span, where there is one.
 * @returns The seconds, or null where there is none or it cannot be read.
 */
const readTimeSpan = (text: string | null | undefined): number | null => {
  const groups = TIME_SPAN.exec(text ?? '')?.groups;

  if (groups === undefined) {
    return null;
  }

  return (
    Number(groups.days ?? '0') * 86_400 +
    Number(groups.hours ?? '0') * 3600 +
    Number(groups.minutes ?? '0') * 60 +
    Number(groups.seconds ?? '0')
  );
};

export { readTimeSpan };

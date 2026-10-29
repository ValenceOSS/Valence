const SAYS_OFF = new Set(['off', 'false', '0', 'no', 'disabled']);

const SAYS_ON = new Set(['1', 'true', 'yes', 'on']);

type TelemetryEnvironment = {
  VALENCE_TELEMETRY: string;
  DO_NOT_TRACK: string;
  NODE_ENV: string;
};

/**
 * Whether the environment forbids sending anonymous statistics, whatever the settings say: Valence's
 * own `VALENCE_TELEMETRY=off`, the `DO_NOT_TRACK=1` many tools honour, or a build that is not a
 * release, which sends only when `VALENCE_TELEMETRY` says on.
 *
 * @param env - The variables, as the environment holds them.
 * @returns Whether nothing may be sent.
 */
const isTelemetryHeldOff = ({
  VALENCE_TELEMETRY,
  DO_NOT_TRACK,
  NODE_ENV,
}: TelemetryEnvironment): boolean => {
  const says = VALENCE_TELEMETRY.trim().toLowerCase();

  return (
    SAYS_OFF.has(says) ||
    SAYS_ON.has(DO_NOT_TRACK.trim().toLowerCase()) ||
    (NODE_ENV !== 'production' && !SAYS_ON.has(says))
  );
};

export type { TelemetryEnvironment };

export { isTelemetryHeldOff };

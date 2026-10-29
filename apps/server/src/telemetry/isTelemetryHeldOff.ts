const SAYS_OFF = new Set(['off', 'false', '0', 'no', 'disabled']);

const SAYS_ON = new Set(['1', 'true', 'yes', 'on']);

type TelemetryEnvironment = {
  VALENCE_TELEMETRY: string;
  DO_NOT_TRACK: string;
};

/**
 * Whether the environment forbids sending anonymous statistics, whatever the settings say: Valence's
 * own `VALENCE_TELEMETRY=off`, or the `DO_NOT_TRACK=1` many tools honour.
 *
 * @param env - The two variables, as the environment holds them.
 * @returns Whether nothing may be sent.
 */
const isTelemetryHeldOff = ({ VALENCE_TELEMETRY, DO_NOT_TRACK }: TelemetryEnvironment): boolean =>
  SAYS_OFF.has(VALENCE_TELEMETRY.trim().toLowerCase()) ||
  SAYS_ON.has(DO_NOT_TRACK.trim().toLowerCase());

export type { TelemetryEnvironment };

export { isTelemetryHeldOff };

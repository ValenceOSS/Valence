type PinnedRequestReason =
  | 'notHttps'
  | 'credentials'
  | 'port'
  | 'host'
  | 'resolvesPrivately'
  | 'redirects'
  | 'slow';

class PinnedRequestRefusal extends Error {
  readonly reason: PinnedRequestReason;

  readonly hostname: string;

  /**
   * Says why a pinned request was not made, or was given up on, and which host it was for.
   *
   * @param reason - What was wrong.
   * @param hostname - The host, where there was one.
   */
  constructor(reason: PinnedRequestReason, hostname: string) {
    super(`${reason}: ${hostname}`);
    this.name = 'PinnedRequestRefusal';
    this.reason = reason;
    this.hostname = hostname;
  }
}

export type { PinnedRequestReason };

export { PinnedRequestRefusal };

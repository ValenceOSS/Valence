import { z } from 'zod';
import type { RequestsVpn } from '@ValenceContracts/schemas/Requests';

const TunnelSchema = z.object({ status: z.string() });

const AddressSchema = z.object({
  public_ip: z.string().default(''),
  country: z.string().default(''),
});

type ReadGluetunOptions = {
  address: string;
  apiKey: string;
  fetch: (
    url: string,
    init: { headers: Record<string, string>; signal: AbortSignal },
  ) => Promise<Response>;
  now?: () => Date;
  timeoutMs?: number;
};

const NOT_SET_UP: RequestsVpn = {
  isConfigured: false,
  isUp: null,
  publicAddress: null,
  country: null,
  checkedAt: null,
  problem: null,
};

/**
 * Asks gluetun's control server whether the tunnel is up, and where the traffic leaves from.
 *
 * Nothing is thrown: a gluetun that cannot be reached or does not understand the question is a VPN
 * that cannot be vouched for, so it reads as down with the reason beside it. A service with no VPN
 * address was never meant to have one and says so rather than reading as down.
 *
 * @param address - The control server, such as `http://gluetun:8000`, or nothing where there is none.
 * @param apiKey - The key gluetun's control server was given, or nothing where it has none.
 * @param fetch - How to ask.
 * @param now - The clock, for when it was asked.
 * @param timeoutMs - How long to wait for an answer.
 * @returns What the VPN is doing.
 */
const readGluetun = async ({
  address,
  apiKey,
  fetch,
  now = () => new Date(),
  timeoutMs = 5000,
}: ReadGluetunOptions): Promise<RequestsVpn> => {
  if (address === '') {
    return NOT_SET_UP;
  }

  const headers: Record<string, string> = apiKey === '' ? {} : { 'X-API-Key': apiKey };
  const checkedAt = now().toISOString();
  const down = (problem: string): RequestsVpn => ({
    isConfigured: true,
    isUp: false,
    publicAddress: null,
    country: null,
    checkedAt,
    problem,
  });

  try {
    const tunnel = await fetch(`${address}/v1/vpn/status`, {
      headers,
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (tunnel.status === 401 || tunnel.status === 403) {
      return down('gluetun refused the question; check VPN_API_KEY');
    }

    if (!tunnel.ok) {
      return down(`gluetun answered ${tunnel.status.toString()}`);
    }

    const { status } = TunnelSchema.parse(await tunnel.json());

    if (status !== 'running') {
      return down(`The tunnel is ${status}`);
    }

    const leaving = await fetch(`${address}/v1/publicip/ip`, {
      headers,
      signal: AbortSignal.timeout(timeoutMs),
    });
    const where = leaving.ok ? AddressSchema.parse(await leaving.json()) : null;

    return {
      isConfigured: true,
      isUp: true,
      publicAddress: where === null || where.public_ip === '' ? null : where.public_ip,
      country: where === null || where.country === '' ? null : where.country,
      checkedAt,
      problem: null,
    };
  } catch (error) {
    return down(
      error instanceof z.ZodError
        ? 'gluetun answered something that was not a status'
        : `gluetun could not be reached at ${address}`,
    );
  }
};

export type { ReadGluetunOptions };

export { readGluetun };

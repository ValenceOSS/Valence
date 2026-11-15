import { createSecureServer } from 'node:http2';
import type { Http2ServerRequest, Http2ServerResponse } from 'node:http2';
import type { Socket } from 'node:net';

const KEY = [
  '-----BEGIN PRIVATE KEY-----',
  'MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgiwLlH5rbJ8Nb+zgU',
  '78CPXVKQanZlbngNeMhMw3kX3yChRANCAASYqROshTSKkP/WbJp+hlubreJdkDXE',
  'xR18DjHRLLFR0Q8Mj0E2VUayLC+Jh2KOl+/5i5nCEW5rhCY2INzB8v/B',
  '-----END PRIVATE KEY-----',
].join('\n');

const CERTIFICATE = [
  '-----BEGIN CERTIFICATE-----',
  'MIIBmzCCAUGgAwIBAgIUHhDf4SoaI3+Td6PcGvh6meLCmMQwCgYIKoZIzj0EAwIw',
  'FDESMBAGA1UEAwwJbG9jYWxob3N0MCAXDTI2MTExNTE2MDg1MVoYDzIxMjYxMDIy',
  'MTYwODUxWjAUMRIwEAYDVQQDDAlsb2NhbGhvc3QwWTATBgcqhkjOPQIBBggqhkjO',
  'PQMBBwNCAASYqROshTSKkP/WbJp+hlubreJdkDXExR18DjHRLLFR0Q8Mj0E2VUay',
  'LC+Jh2KOl+/5i5nCEW5rhCY2INzB8v/Bo28wbTAdBgNVHQ4EFgQUEvZag92KWo6J',
  'UxjV0ILq8xj2ZI4wHwYDVR0jBBgwFoAUEvZag92KWo6JUxjV0ILq8xj2ZI4wDwYD',
  'VR0TAQH/BAUwAwEB/zAaBgNVHREEEzARgglsb2NhbGhvc3SHBH8AAAEwCgYIKoZI',
  'zj0EAwIDSAAwRQIhAO21OxeybHvMZNe2XyoXLFZJzsutYyLoz89BENbYD/ZiAiBL',
  'V7DCR5aR3cBRrO7QIRTwpOd21cqZCl46FdDtG5/7CA==',
  '-----END CERTIFICATE-----',
].join('\n');

/**
 * Runs a test against a TLS server on this machine that offers HTTP/2 and HTTP/1.1 alike, signed
 * by a certificate nobody trusts, so a client has to be told to accept it.
 *
 * @param answer - How the server answers each request.
 * @param test - The test, given the port.
 */
const aSecureServer = async (
  answer: (request: Http2ServerRequest, response: Http2ServerResponse) => void,
  test: (port: number) => Promise<void>,
) => {
  const server = createSecureServer({ key: KEY, cert: CERTIFICATE, allowHTTP1: true }, answer);
  const connections = new Set<Socket>();

  server.on('connection', (socket: Socket) => {
    connections.add(socket);
  });

  await new Promise<void>((done) => {
    server.listen(0, '127.0.0.1', done);
  });

  try {
    const address = server.address();

    await test(typeof address === 'object' && address !== null ? address.port : 0);
  } finally {
    for (const connection of connections) {
      connection.destroy();
    }

    server.close();
  }
};

export { aSecureServer };

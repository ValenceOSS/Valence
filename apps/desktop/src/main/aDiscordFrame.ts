const HEADER = 8;

const HANDSHAKE = 0;

const FRAME = 1;

const MOST_PAYLOAD_BYTES = 64 * 1024;

type DiscordFrame = { opcode: number; payload: string };

/**
 * Wraps a message the way Discord's socket expects to read one.
 *
 * Two little-endian thirty-two bit numbers and then the JSON: what kind of message it is, and how
 * many bytes of it there are. There is no delimiter and no terminator, so the length is the only
 * thing separating one message from the next.
 *
 * @param opcode - What kind of message this is.
 * @param payload - The JSON to send.
 * @returns The bytes to write.
 */
const aDiscordFrame = (opcode: number, payload: string): Buffer => {
  const body = Buffer.from(payload, 'utf8');
  const framed = Buffer.alloc(HEADER + body.length);

  framed.writeInt32LE(opcode, 0);
  framed.writeInt32LE(body.length, 4);
  body.copy(framed, HEADER);

  return framed;
};

/**
 * Reads whole messages out of whatever has arrived so far.
 *
 * A socket hands over bytes rather than messages, so a read can carry half of one, or three and a
 * bit. Anything short of a whole message is handed back to be read again once more arrives.
 *
 * A message that says it is shorter than nothing or longer than Discord ever sends is not one: the
 * reading stops there and the result says the peer is not speaking the protocol.
 *
 * @param arrived - Everything received and not yet read.
 * @returns The whole messages, the remainder to keep, and whether the bytes are no protocol at all.
 */
const readDiscordFrames = (
  arrived: Buffer,
): { frames: DiscordFrame[]; rest: Buffer; isBroken: boolean } => {
  const frames: DiscordFrame[] = [];
  let at = 0;

  while (arrived.length - at >= HEADER) {
    const length = arrived.readInt32LE(at + 4);

    if (length < 0 || length > MOST_PAYLOAD_BYTES) {
      return { frames, rest: Buffer.alloc(0), isBroken: true };
    }

    if (arrived.length - at - HEADER < length) {
      break;
    }

    frames.push({
      opcode: arrived.readInt32LE(at),
      payload: arrived.toString('utf8', at + HEADER, at + HEADER + length),
    });

    at += HEADER + length;
  }

  return { frames, rest: arrived.subarray(at), isBroken: false };
};

export type { DiscordFrame };

export { aDiscordFrame, FRAME, HANDSHAKE, readDiscordFrames };

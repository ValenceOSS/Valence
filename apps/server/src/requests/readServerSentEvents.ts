/**
 * Reads a server-sent event stream as it arrives, handing on the data of each event and ignoring
 * the comments a quiet stream sends to keep itself open.
 *
 * @param body - The stream.
 * @param onData - Told the data of each event, its lines joined as the format joins them.
 * @returns When the stream ends.
 */
const readServerSentEvents = async (
  body: ReadableStream<Uint8Array>,
  onData: (data: string) => void,
): Promise<void> => {
  const decoder = new TextDecoder();
  let held = '';

  const hand = (block: string) => {
    const lines = block
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).replace(/^ /, ''));

    if (lines.length > 0) {
      onData(lines.join('\n'));
    }
  };

  for await (const chunk of body) {
    held += decoder.decode(chunk, { stream: true }).replace(/\r\n?/g, '\n');

    let end = held.indexOf('\n\n');

    while (end !== -1) {
      hand(held.slice(0, end));
      held = held.slice(end + 2);
      end = held.indexOf('\n\n');
    }
  }

  hand(held);
};

export { readServerSentEvents };

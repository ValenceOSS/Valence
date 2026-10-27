import { randomBytes } from 'node:crypto';
import type { FormPart } from '@ValenceSDK/host/ValenceHost';

/**
 * Builds a multipart form from the fields a plugin named, a file among them given as base64, so a
 * plugin running where there are no bytes can still send a service the file it asks for.
 *
 * @param form - Each field's name, and its text or its file.
 * @returns The body, and the content type that says where its parts divide.
 */
const multipartOf = (
  form: Readonly<Record<string, FormPart>>,
): { body: Buffer; contentType: string } => {
  const boundary = `valence-${randomBytes(12).toString('hex')}`;
  const quoted = (value: string): string => value.replace(/["\r\n\\]/g, '_');
  const parts = Object.entries(form).flatMap(([name, part]) => [
    Buffer.from(
      typeof part === 'string'
        ? `--${boundary}\r\ncontent-disposition: form-data; name="${quoted(name)}"\r\n\r\n`
        : `--${boundary}\r\ncontent-disposition: form-data; name="${quoted(name)}"; filename="${quoted(part.fileName)}"\r\ncontent-type: ${quoted(part.contentType)}\r\n\r\n`,
    ),
    typeof part === 'string' ? Buffer.from(part) : Buffer.from(part.base64, 'base64'),
    Buffer.from('\r\n'),
  ]);

  return {
    body: Buffer.concat([...parts, Buffer.from(`--${boundary}--\r\n`)]),
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
};

export { multipartOf };

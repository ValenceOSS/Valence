import { z } from 'zod';

const UPLOAD_PIECE_BYTES = 50 * 1024 * 1024;

const UploadStartedSchema = z.object({
  uploadId: z.string().uuid(),
  pieceBytes: z.number().int().positive(),
  pieces: z.number().int().positive(),
});

const UploadPiecesSchema = z.object({
  received: z.array(z.number().int().nonnegative()),
  pieces: z.number().int().positive(),
});

type UploadStarted = z.infer<typeof UploadStartedSchema>;
type UploadPieces = z.infer<typeof UploadPiecesSchema>;

export type { UploadPieces, UploadStarted };

export { UPLOAD_PIECE_BYTES, UploadPiecesSchema, UploadStartedSchema };

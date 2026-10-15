import { z } from 'zod';

const ProfileLibrarySchema = z.object({
  id: z.string(),
  name: z.string(),
  mayView: z.boolean(),
  maximumAge: z.number().int().min(0).max(21).nullable(),
  allowsUnrated: z.boolean(),
  accountMaximumAge: z.number().int().min(0).max(21).nullable(),
});

const ProfileLibrariesSchema = z.object({ libraries: z.array(ProfileLibrarySchema) });

const ProfileCeilingRequestSchema = z.object({
  maximumAge: z.number().int().min(0).max(21),
  allowsUnrated: z.boolean().default(false),
});

const MayRequestSchema = z.object({ mayRequest: z.boolean() });

type ProfileLibrary = z.infer<typeof ProfileLibrarySchema>;

export type { ProfileLibrary };

export {
  MayRequestSchema,
  ProfileCeilingRequestSchema,
  ProfileLibrariesSchema,
  ProfileLibrarySchema,
};

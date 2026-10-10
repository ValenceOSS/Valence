ALTER TABLE "pre_transcode_refusal" DROP CONSTRAINT "pre_transcode_refusal_pkey";--> statement-breakpoint
ALTER TABLE "pre_transcode_refusal" ADD CONSTRAINT "pre_transcode_refusal_mediaItemId_target_pk" PRIMARY KEY("mediaItemId","target");

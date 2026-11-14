ALTER TABLE "resource_sample" ADD COLUMN "networkReceivedBytesPerSecond" real;--> statement-breakpoint
ALTER TABLE "resource_sample" ADD COLUMN "networkSentBytesPerSecond" real;--> statement-breakpoint
ALTER TABLE "resource_sample" ADD COLUMN "streamedBytesPerSecond" real;
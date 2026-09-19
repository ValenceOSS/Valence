CREATE TABLE "valence_requests"."request_log" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "valence_requests"."request_log_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"request_id" uuid NOT NULL,
	"message" text NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "valence_requests"."request_log" ADD CONSTRAINT "request_log_request_id_media_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "valence_requests"."media_request"("id") ON DELETE cascade ON UPDATE no action;
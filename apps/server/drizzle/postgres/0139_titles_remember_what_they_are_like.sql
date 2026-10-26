CREATE TABLE "title_likeness" (
	"kind" text NOT NULL,
	"catalogueId" text NOT NULL,
	"genreIds" jsonb NOT NULL,
	"keywordIds" jsonb NOT NULL,
	"castIds" jsonb NOT NULL,
	"crewIds" jsonb NOT NULL,
	"recommendedIds" jsonb NOT NULL,
	"readAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "title_likeness_kind_catalogueId_pk" PRIMARY KEY("kind","catalogueId")
);

CREATE TABLE "game_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"display_name" text NOT NULL,
	"icon" text NOT NULL,
	"rounds_to_win" smallint NOT NULL,
	"round_label_key" text NOT NULL,
	"supports_domination" boolean DEFAULT false NOT NULL,
	"team_sizes" smallint[] NOT NULL,
	"elo_margin_step" real DEFAULT 0.5 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "game_types_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "match_participants" ADD COLUMN "stats" jsonb;--> statement-breakpoint
ALTER TABLE "match_rounds" ADD COLUMN "detail" jsonb;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "game_type_id" uuid;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "team_size" smallint DEFAULT 2 NOT NULL;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_game_type_id_game_types_id_fk" FOREIGN KEY ("game_type_id") REFERENCES "public"."game_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "matches_game_type_played_at_idx" ON "matches" USING btree ("game_type_id","played_at");--> statement-breakpoint

-- Ab hier von Hand ergaenzt: Seed und Backfill. drizzle-kit erzeugt nur DDL,
-- die Daten muessen aber in derselben Migration mitkommen, sonst steht die
-- Datenbank zwischen zwei Migrationen mit einem leeren game_type_id da.

-- Die beiden Disziplinen. `rounds_to_win` 2 ist Best of 3 (Kicker), 3 ist
-- Best of 5 Legs (Dart).
INSERT INTO "game_types" ("key", "display_name", "icon", "rounds_to_win", "round_label_key", "supports_domination", "team_sizes", "sort_order") VALUES
	('kicker', 'Kicker', 'sports_soccer', 2, 'gameType.round', true,  '{1,2}', 0),
	('darts',  'Dart',   'my_location',   3, 'gameType.leg',   true,  '{1,2}', 1);--> statement-breakpoint

-- Jedes Bestandsspiel ist ein Kickerspiel: eine andere Disziplin gab es nicht.
UPDATE "matches" SET "game_type_id" = (SELECT "id" FROM "game_types" WHERE "key" = 'kicker') WHERE "game_type_id" IS NULL;--> statement-breakpoint

-- `team_size` aus dem bisherigen Booleschen Wert ableiten.
UPDATE "matches" SET "team_size" = CASE WHEN "is_single" THEN 1 ELSE 2 END;--> statement-breakpoint

-- Erst nach dem Backfill darf die Spalte verpflichtend werden.
ALTER TABLE "matches" ALTER COLUMN "game_type_id" SET NOT NULL;
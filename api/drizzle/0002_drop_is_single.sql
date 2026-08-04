ALTER TABLE "matches" ALTER COLUMN "game_type_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "matches" DROP COLUMN "is_single";
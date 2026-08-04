CREATE TABLE "match_proposal_players" (
	"proposal_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"response" text DEFAULT 'pending' NOT NULL,
	CONSTRAINT "match_proposal_players_proposal_id_user_id_pk" PRIMARY KEY("proposal_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "match_proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_type_id" uuid NOT NULL,
	"team_size" smallint NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "queue_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"game_type_id" uuid NOT NULL,
	"team_size" smallint NOT NULL,
	"status" text DEFAULT 'waiting' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"proposal_id" uuid
);
--> statement-breakpoint
ALTER TABLE "match_proposal_players" ADD CONSTRAINT "match_proposal_players_proposal_id_match_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."match_proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_proposal_players" ADD CONSTRAINT "match_proposal_players_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_proposals" ADD CONSTRAINT "match_proposals_game_type_id_game_types_id_fk" FOREIGN KEY ("game_type_id") REFERENCES "public"."game_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queue_entries" ADD CONSTRAINT "queue_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queue_entries" ADD CONSTRAINT "queue_entries_game_type_id_game_types_id_fk" FOREIGN KEY ("game_type_id") REFERENCES "public"."game_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "queue_entries_one_waiting_per_user_and_game_type" ON "queue_entries" USING btree ("user_id","game_type_id") WHERE status = 'waiting';--> statement-breakpoint
CREATE INDEX "queue_entries_lookup_idx" ON "queue_entries" USING btree ("game_type_id","team_size","status","joined_at");
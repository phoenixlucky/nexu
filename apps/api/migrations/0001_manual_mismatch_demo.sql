-- Intentional mismatch demo for CI testing.
-- This file does not match the actual schema change in src/db/schema/index.ts.
ALTER TABLE "users" ADD COLUMN "mismatch_demo" text;

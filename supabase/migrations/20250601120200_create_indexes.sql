-- Migration: Create indexes for AI Recipe Keeper
-- Purpose: Add performance indexes for all tables to optimize common queries
-- Tables affected: recipes, tags, recipe_tags, extraction_logs, collections, recipe_collections, daily_extraction_limits
-- Notes: These indexes optimize user-specific queries, lookups, and admin operations

-- indexes for recipes table
-- optimizes user's recipe listing ordered by creation date
create index idx_recipes_user_id_created_at on recipes(user_id, created_at desc);

-- optimizes filtering by source type (manual, url, text)
create index idx_recipes_source_type on recipes(source_type);

-- optimizes duplicate image detection using hash
-- only index non-null values to save space
create index idx_recipes_image_hash on recipes(image_hash) where image_hash is not null;

-- indexes for tags table
-- optimizes active tag lookups by slug
create index idx_tags_slug on tags(slug) where is_active = true;

-- optimizes filtering active vs inactive tags
create index idx_tags_is_active on tags(is_active);

-- indexes for recipe_tags table
-- optimizes reverse lookups from tags to recipes
create index idx_recipe_tags_tag_id on recipe_tags(tag_id);

-- indexes for extraction_logs table
-- optimizes user's extraction history ordered by date
create index idx_extraction_logs_user_id_created_at on extraction_logs(user_id, created_at desc);

-- optimizes admin queries and log cleanup operations
create index idx_extraction_logs_created_at on extraction_logs(created_at);

-- indexes for collections table
-- optimizes user's collections listing
create index idx_collections_user_id on collections(user_id);

-- indexes for recipe_collections table
-- optimizes collection content queries
create index idx_recipe_collections_collection_id on recipe_collections(collection_id);

-- indexes for daily_extraction_limits table
-- optimizes date-based limit queries
create index idx_daily_extraction_limits_date on daily_extraction_limits(date); 
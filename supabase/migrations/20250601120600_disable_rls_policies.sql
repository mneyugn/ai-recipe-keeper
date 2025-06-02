-- Migration: Disable RLS policies for AI Recipe Keeper (DEVELOPMENT ONLY)
-- Tables affected: All tables (users, recipes, tags, recipe_tags, extraction_logs, collections, recipe_collections, daily_extraction_limits)
-- Purpose: Temporarily disable RLS policies for development and testing
-- WARNING: This removes all security restrictions - DO NOT USE IN PRODUCTION

-- drop rls policies for users table
drop policy if exists users_select_own on users;
drop policy if exists users_update_own on users;

-- drop rls policies for recipes table
drop policy if exists recipes_select_own on recipes;
drop policy if exists recipes_insert_own on recipes;
drop policy if exists recipes_update_own on recipes;
drop policy if exists recipes_delete_own on recipes;

-- drop rls policies for recipe_tags table
drop policy if exists recipe_tags_select_own on recipe_tags;
drop policy if exists recipe_tags_insert_own on recipe_tags;
drop policy if exists recipe_tags_delete_own on recipe_tags;

-- drop rls policies for extraction_logs table
drop policy if exists extraction_logs_insert_own on extraction_logs;
drop policy if exists extraction_logs_select_admin on extraction_logs;

-- drop rls policies for collections table
drop policy if exists collections_select_own on collections;
drop policy if exists collections_insert_own on collections;
drop policy if exists collections_update_own on collections;
drop policy if exists collections_delete_own on collections;

-- drop rls policies for recipe_collections table
drop policy if exists recipe_collections_select_own on recipe_collections;
drop policy if exists recipe_collections_insert_own on recipe_collections;
drop policy if exists recipe_collections_delete_own on recipe_collections;

-- drop rls policies for daily_extraction_limits table
drop policy if exists daily_extraction_limits_select_own on daily_extraction_limits;
drop policy if exists daily_extraction_limits_insert_own on daily_extraction_limits;
drop policy if exists daily_extraction_limits_update_own on daily_extraction_limits;

-- drop rls policy for tags table
drop policy if exists tags_select_active on tags; 

-- disable row level security for all tables (DEVELOPMENT ONLY)
alter table users disable row level security;
alter table recipes disable row level security;
alter table tags disable row level security;
alter table recipe_tags disable row level security;
alter table extraction_logs disable row level security;
alter table collections disable row level security;
alter table recipe_collections disable row level security;
alter table daily_extraction_limits disable row level security; 
-- Migration: Disable RLS policies for AI Recipe Keeper
-- Purpose: Remove all row level security policies from tables
-- Tables affected: All tables (users, recipes, tags, recipe_tags, parsing_logs, collections, recipe_collections, daily_parsing_limits)
-- Notes: This migration disables all RLS policies for development/testing purposes

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

-- drop rls policies for parsing_logs table
drop policy if exists parsing_logs_insert_own on parsing_logs;
drop policy if exists parsing_logs_select_admin on parsing_logs;

-- drop rls policies for collections table
drop policy if exists collections_select_own on collections;
drop policy if exists collections_insert_own on collections;
drop policy if exists collections_update_own on collections;
drop policy if exists collections_delete_own on collections;

-- drop rls policies for recipe_collections table
drop policy if exists recipe_collections_select_own on recipe_collections;
drop policy if exists recipe_collections_insert_own on recipe_collections;
drop policy if exists recipe_collections_delete_own on recipe_collections;

-- drop rls policies for daily_parsing_limits table
drop policy if exists daily_parsing_limits_select_own on daily_parsing_limits;
drop policy if exists daily_parsing_limits_insert_own on daily_parsing_limits;
drop policy if exists daily_parsing_limits_update_own on daily_parsing_limits;

-- drop rls policy for tags table
drop policy if exists tags_select_active on tags; 
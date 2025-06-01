-- Migration: Create core tables for AI Recipe Keeper
-- Purpose: Establish the foundation tables for users, recipes, tags, and their relationships
-- Tables affected: users, recipes, tags, recipe_tags
-- Notes: This migration creates the core data structure for the recipe management system

-- enable row level security for all tables created in this migration
-- this ensures data access is properly controlled from the start

-- create users table (extends supabase auth.users)
create table users (
    id uuid primary key,
    username text unique,
    email text unique not null,
    is_admin boolean default false not null,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- enable row level security for users table
alter table users enable row level security;

-- create recipes table
-- this is the main table for storing recipe data
-- ingredients and steps are stored as text arrays for mvp simplicity
create table recipes (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    name text not null,
    ingredients text[] not null check (array_length(ingredients, 1) between 1 and 50),
    steps text[] not null check (array_length(steps, 1) between 1 and 50),
    preparation_time text,
    source_type text not null default 'manual' check (source_type in ('manual', 'url', 'text')),
    source_url text,
    source_metadata jsonb default '{}'::jsonb,
    image_url text,
    image_hash text,
    notes text check (char_length(notes) <= 5000),
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- enable row level security for recipes table
alter table recipes enable row level security;

-- create tags table
-- tags can be active/inactive for soft delete functionality
create table tags (
    id uuid primary key default gen_random_uuid(),
    name text unique not null,
    slug text unique not null,
    is_active boolean default true not null,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- enable row level security for tags table
alter table tags enable row level security;

-- create recipe_tags junction table
-- establishes many-to-many relationship between recipes and tags
create table recipe_tags (
    recipe_id uuid not null references recipes(id) on delete cascade,
    tag_id uuid not null references tags(id) on delete cascade,
    created_at timestamptz default now() not null,
    primary key (recipe_id, tag_id)
);

-- enable row level security for recipe_tags table
alter table recipe_tags enable row level security; 
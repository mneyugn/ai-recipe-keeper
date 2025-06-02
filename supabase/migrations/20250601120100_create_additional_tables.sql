-- Migration: Create additional tables for AI Recipe Keeper
-- Purpose: Add support tables for extraction logs, collections, and rate limiting
-- Tables affected: extraction_logs, collections, recipe_collections, daily_extraction_limits
-- Notes: These tables support advanced features like AI extraction tracking and recipe organization

-- create extraction_logs table
-- tracks ai extraction attempts for monitoring and rate limiting
-- includes token usage and error tracking for debugging
create table extraction_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    module text not null check (module in ('text', 'url')),
    input_data text not null,
    extraction_result jsonb,
    feedback text check (feedback in ('positive', 'negative')),
    feedback_timestamp timestamptz,
    tokens_used integer,
    generation_duration integer,
    error_message text,
    created_at timestamptz default now() not null
);

-- enable row level security for extraction_logs table
alter table extraction_logs enable row level security;

-- create collections table
-- allows users to organize recipes into custom collections
-- supports future sharing functionality with is_public flag
create table collections (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    name text not null,
    description text,
    cover_image text,
    is_public boolean default false not null,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- enable row level security for collections table
alter table collections enable row level security;

-- create recipe_collections junction table
-- establishes many-to-many relationship between recipes and collections
-- tracks who added the recipe to the collection for auditing
create table recipe_collections (
    recipe_id uuid not null references recipes(id) on delete cascade,
    collection_id uuid not null references collections(id) on delete cascade,
    added_at timestamptz default now() not null,
    added_by uuid not null references users(id) on delete cascade,
    primary key (recipe_id, collection_id)
);

-- enable row level security for recipe_collections table
alter table recipe_collections enable row level security;

-- create daily_extraction_limits table
-- enforces daily limits on ai extraction to control costs
-- automatically resets daily with date-based primary key
create table daily_extraction_limits (
    user_id uuid not null references users(id) on delete cascade,
    date date not null default current_date,
    count integer not null default 0,
    primary key (user_id, date),
    -- enforce maximum daily extraction limit of 100 requests
    constraint max_daily_extraction check (count <= 100)
);

-- enable row level security for daily_extraction_limits table
alter table daily_extraction_limits enable row level security; 
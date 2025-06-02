-- Migration: Create RLS policies for AI Recipe Keeper
-- Purpose: Establish comprehensive row level security policies for data access control
-- Tables affected: All tables (users, recipes, tags, recipe_tags, extraction_logs, collections, recipe_collections, daily_extraction_limits)
-- Notes: These policies ensure users can only access their own data, with special provisions for admins and public data

-- rls policies for users table
-- users can view and update their own profile data
create policy users_select_own on users
    for select using (auth.uid() = id);

create policy users_update_own on users
    for update using (auth.uid() = id);

-- rls policies for recipes table
-- users have full crud access to their own recipes only
create policy recipes_select_own on recipes
    for select using (auth.uid() = user_id);

create policy recipes_insert_own on recipes
    for insert with check (auth.uid() = user_id);

create policy recipes_update_own on recipes
    for update using (auth.uid() = user_id);

create policy recipes_delete_own on recipes
    for delete using (auth.uid() = user_id);

-- rls policies for recipe_tags table
-- users can manage tags for their own recipes only
-- policies check recipe ownership through join
create policy recipe_tags_select_own on recipe_tags
    for select using (
        exists (
            select 1 from recipes
            where recipes.id = recipe_tags.recipe_id
            and recipes.user_id = auth.uid()
        )
    );

create policy recipe_tags_insert_own on recipe_tags
    for insert with check (
        exists (
            select 1 from recipes
            where recipes.id = recipe_tags.recipe_id
            and recipes.user_id = auth.uid()
        )
    );

create policy recipe_tags_delete_own on recipe_tags
    for delete using (
        exists (
            select 1 from recipes
            where recipes.id = recipe_tags.recipe_id
            and recipes.user_id = auth.uid()
        )
    );

-- rls policies for extraction_logs table
-- users can insert their own logs, only admins can read logs
-- this protects user privacy while allowing admin monitoring
create policy extraction_logs_insert_own on extraction_logs
    for insert with check (auth.uid() = user_id);

create policy extraction_logs_select_admin on extraction_logs
    for select using (
        exists (
            select 1 from users
            where users.id = auth.uid()
            and users.is_admin = true
        )
    );

-- rls policies for collections table
-- users have full crud access to their own collections only
create policy collections_select_own on collections
    for select using (auth.uid() = user_id);

create policy collections_insert_own on collections
    for insert with check (auth.uid() = user_id);

create policy collections_update_own on collections
    for update using (auth.uid() = user_id);

create policy collections_delete_own on collections
    for delete using (auth.uid() = user_id);

-- rls policies for recipe_collections table
-- users can manage recipe-collection relationships for their own data only
-- policies verify ownership of both recipe and collection
create policy recipe_collections_select_own on recipe_collections
    for select using (
        exists (
            select 1 from collections
            where collections.id = recipe_collections.collection_id
            and collections.user_id = auth.uid()
        )
    );

create policy recipe_collections_insert_own on recipe_collections
    for insert with check (
        exists (
            select 1 from recipes
            where recipes.id = recipe_collections.recipe_id
            and recipes.user_id = auth.uid()
        ) and
        exists (
            select 1 from collections
            where collections.id = recipe_collections.collection_id
            and collections.user_id = auth.uid()
        )
    );

create policy recipe_collections_delete_own on recipe_collections
    for delete using (
        exists (
            select 1 from collections
            where collections.id = recipe_collections.collection_id
            and collections.user_id = auth.uid()
        )
    );

-- rls policies for daily_extraction_limits table
-- users can access their own extraction limit data only
create policy daily_extraction_limits_select_own on daily_extraction_limits
    for select using (auth.uid() = user_id);

create policy daily_extraction_limits_insert_own on daily_extraction_limits
    for insert with check (auth.uid() = user_id);

create policy daily_extraction_limits_update_own on daily_extraction_limits
    for update using (auth.uid() = user_id);

-- rls policy for tags table
-- tags are publicly readable when active (for all authenticated users)
-- no insert/update/delete policies - tags managed by admin functions
create policy tags_select_active on tags
    for select using (is_active = true); 
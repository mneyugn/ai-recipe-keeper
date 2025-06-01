-- Migration: Create triggers and functions for AI Recipe Keeper
-- Purpose: Add automated functionality for timestamp updates, user creation, and parsing limits
-- Functions created: update_updated_at_column, handle_new_user, check_parsing_limit, increment_parsing_count, clean_old_parsing_logs, validate_recipe_data
-- Triggers created: Auto-update timestamps, auto-create user profiles, recipe validation
-- Notes: These functions automate common operations and enforce business rules

-- function to automatically update updated_at timestamps
-- this function will be used by triggers on tables with updated_at columns
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

-- function to validate recipe ingredients and steps
-- enforces length limits that cannot be done with check constraints with subqueries
create or replace function validate_recipe_data()
returns trigger as $$
declare
    ingredient text;
    step text;
begin
    -- validate individual ingredients length (max 200 characters)
    foreach ingredient in array new.ingredients loop
        if char_length(ingredient) > 200 then
            raise exception 'Ingredient exceeds maximum length of 200 characters: %', ingredient;
        end if;
    end loop;
    
    -- validate individual steps length (max 2000 characters)
    foreach step in array new.steps loop
        if char_length(step) > 2000 then
            raise exception 'Step exceeds maximum length of 2000 characters';
        end if;
    end loop;
    
    return new;
end;
$$ language 'plpgsql';

-- create triggers for automatic timestamp updates
-- these triggers ensure updated_at is always current when records change

-- trigger for users table
create trigger update_users_updated_at before update on users
    for each row execute function update_updated_at_column();

-- trigger for recipes table
create trigger update_recipes_updated_at before update on recipes
    for each row execute function update_updated_at_column();

-- trigger for tags table  
create trigger update_tags_updated_at before update on tags
    for each row execute function update_updated_at_column();

-- trigger for collections table
create trigger update_collections_updated_at before update on collections
    for each row execute function update_updated_at_column();

-- trigger for recipe data validation
create trigger validate_recipe_data_trigger before insert or update on recipes
    for each row execute function validate_recipe_data();

-- function to automatically create user profile when user registers
-- this syncs supabase auth.users with our public.users table
-- security definer allows this function to access auth schema
create or replace function handle_new_user()
returns trigger as $$
begin
    insert into public.users (id, email)
    values (new.id, new.email);
    return new;
end;
$$ language 'plpgsql' security definer;

-- trigger to create user profile on registration
-- this fires after a new user is created in auth.users
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function handle_new_user();

-- function to check daily parsing limit for a user
-- returns true if user is under daily limit, false otherwise
-- automatically creates limit record if it doesn't exist
create or replace function check_parsing_limit(p_user_id uuid)
returns boolean as $$
declare
    current_count integer;
begin
    -- create record for today if it doesn't exist
    insert into daily_parsing_limits (user_id, date, count)
    values (p_user_id, current_date, 0)
    on conflict (user_id, date) do nothing;

    -- get current count for today
    select count into current_count
    from daily_parsing_limits
    where user_id = p_user_id and date = current_date;

    -- return true if under limit (100 requests per day)
    return current_count < 100;
end;
$$ language 'plpgsql' security definer;

-- function to increment parsing count for a user
-- this should be called after successful parsing request
-- updates the daily counter for rate limiting
create or replace function increment_parsing_count(p_user_id uuid)
returns void as $$
begin
    update daily_parsing_limits
    set count = count + 1
    where user_id = p_user_id and date = current_date;
end;
$$ language 'plpgsql' security definer;

-- function to clean old parsing logs (older than 30 days)
-- this helps manage database size and removes old log data
-- should be called periodically via pg_cron or external scheduler
create or replace function clean_old_parsing_logs()
returns void as $$
begin
    delete from parsing_logs
    where created_at < now() - interval '30 days';
end;
$$ language 'plpgsql'; 
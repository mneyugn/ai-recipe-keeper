# Schemat bazy danych AI RecipeKeeper MVP

## 1. Lista tabel z kolumnami

### users (managed by Supabase Auth)

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    username TEXT UNIQUE,
    email TEXT UNIQUE NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### recipes

```sql
CREATE TABLE recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    ingredients TEXT[] NOT NULL CHECK (array_length(ingredients, 1) BETWEEN 1 AND 50),
    steps TEXT[] NOT NULL CHECK (array_length(steps, 1) BETWEEN 1 AND 50),
    preparation_time TEXT,
    source_type TEXT NOT NULL DEFAULT 'manual' CHECK (source_type IN ('manual', 'url', 'text')),
    source_url TEXT,
    source_metadata JSONB DEFAULT '{}'::jsonb,
    image_url TEXT,
    image_hash TEXT,
    notes TEXT CHECK (char_length(notes) <= 5000),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT valid_ingredients CHECK (
        array_length(ingredients, 1) IS NOT NULL AND
        NOT EXISTS (
            SELECT 1 FROM unnest(ingredients) AS ingredient
            WHERE char_length(ingredient) > 200
        )
    ),
    CONSTRAINT valid_steps CHECK (
        array_length(steps, 1) IS NOT NULL AND
        NOT EXISTS (
            SELECT 1 FROM unnest(steps) AS step
            WHERE char_length(step) > 2000
        )
    )
);
```

### tags

```sql
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### recipe_tags

```sql
CREATE TABLE recipe_tags (
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (recipe_id, tag_id)
);
```

### parsing_logs

```sql
CREATE TABLE parsing_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    module TEXT NOT NULL CHECK (module IN ('text', 'url')),
    input_data TEXT NOT NULL,
    parsed_result JSONB,
    feedback TEXT CHECK (feedback IN ('positive', 'negative')),
    feedback_timestamp TIMESTAMPTZ,
    tokens_used INTEGER,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### collections

```sql
CREATE TABLE collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    cover_image TEXT,
    is_public BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### recipe_collections

```sql
CREATE TABLE recipe_collections (
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    added_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (recipe_id, collection_id)
);
```

### daily_parsing_limits

```sql
CREATE TABLE daily_parsing_limits (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, date),
    CONSTRAINT max_daily_parsing CHECK (count <= 100)
);
```

## 2. Relacje między tabelami

- **users → recipes**: One-to-Many (jeden użytkownik może mieć wiele przepisów)
- **recipes → recipe_tags → tags**: Many-to-Many (przepis może mieć wiele tagów, tag może być przypisany do wielu przepisów)
- **users → parsing_logs**: One-to-Many (jeden użytkownik może mieć wiele logów parsowania)
- **users → collections**: One-to-Many (jeden użytkownik może mieć wiele kolekcji)
- **recipes → recipe_collections → collections**: Many-to-Many (przepis może należeć do wielu kolekcji, kolekcja może zawierać wiele przepisów)
- **users → daily_parsing_limits**: One-to-Many (śledzenie dziennych limitów per użytkownik)

## 3. Indeksy

```sql
-- Indeksy dla recipes
CREATE INDEX idx_recipes_user_id_created_at ON recipes(user_id, created_at DESC);
CREATE INDEX idx_recipes_source_type ON recipes(source_type);
CREATE INDEX idx_recipes_image_hash ON recipes(image_hash) WHERE image_hash IS NOT NULL;

-- Indeksy dla tags
CREATE INDEX idx_tags_slug ON tags(slug) WHERE is_active = TRUE;
CREATE INDEX idx_tags_is_active ON tags(is_active);

-- Indeksy dla recipe_tags
CREATE INDEX idx_recipe_tags_tag_id ON recipe_tags(tag_id);

-- Indeksy dla parsing_logs
CREATE INDEX idx_parsing_logs_user_id_created_at ON parsing_logs(user_id, created_at DESC);
CREATE INDEX idx_parsing_logs_created_at ON parsing_logs(created_at);

-- Indeksy dla collections
CREATE INDEX idx_collections_user_id ON collections(user_id);

-- Indeksy dla recipe_collections
CREATE INDEX idx_recipe_collections_collection_id ON recipe_collections(collection_id);

-- Indeksy dla daily_parsing_limits
CREATE INDEX idx_daily_parsing_limits_date ON daily_parsing_limits(date);
```

## 4. Zasady PostgreSQL Row Level Security (RLS)

```sql
-- Włączenie RLS dla wszystkich tabel
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE parsing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_parsing_limits ENABLE ROW LEVEL SECURITY;

-- Polityki dla users
CREATE POLICY users_select_own ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY users_update_own ON users
    FOR UPDATE USING (auth.uid() = id);

-- Polityki dla recipes
CREATE POLICY recipes_select_own ON recipes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY recipes_insert_own ON recipes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY recipes_update_own ON recipes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY recipes_delete_own ON recipes
    FOR DELETE USING (auth.uid() = user_id);

-- Polityki dla recipe_tags
CREATE POLICY recipe_tags_select_own ON recipe_tags
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM recipes
            WHERE recipes.id = recipe_tags.recipe_id
            AND recipes.user_id = auth.uid()
        )
    );

CREATE POLICY recipe_tags_insert_own ON recipe_tags
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM recipes
            WHERE recipes.id = recipe_tags.recipe_id
            AND recipes.user_id = auth.uid()
        )
    );

CREATE POLICY recipe_tags_delete_own ON recipe_tags
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM recipes
            WHERE recipes.id = recipe_tags.recipe_id
            AND recipes.user_id = auth.uid()
        )
    );

-- Polityki dla parsing_logs (tylko administratorzy mogą czytać)
CREATE POLICY parsing_logs_insert_own ON parsing_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY parsing_logs_select_admin ON parsing_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_admin = TRUE
        )
    );

-- Polityki dla collections
CREATE POLICY collections_select_own ON collections
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY collections_insert_own ON collections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY collections_update_own ON collections
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY collections_delete_own ON collections
    FOR DELETE USING (auth.uid() = user_id);

-- Polityki dla recipe_collections
CREATE POLICY recipe_collections_select_own ON recipe_collections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM collections
            WHERE collections.id = recipe_collections.collection_id
            AND collections.user_id = auth.uid()
        )
    );

CREATE POLICY recipe_collections_insert_own ON recipe_collections
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM recipes
            WHERE recipes.id = recipe_collections.recipe_id
            AND recipes.user_id = auth.uid()
        ) AND
        EXISTS (
            SELECT 1 FROM collections
            WHERE collections.id = recipe_collections.collection_id
            AND collections.user_id = auth.uid()
        )
    );

CREATE POLICY recipe_collections_delete_own ON recipe_collections
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM collections
            WHERE collections.id = recipe_collections.collection_id
            AND collections.user_id = auth.uid()
        )
    );

-- Polityki dla daily_parsing_limits
CREATE POLICY daily_parsing_limits_select_own ON daily_parsing_limits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY daily_parsing_limits_insert_own ON daily_parsing_limits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY daily_parsing_limits_update_own ON daily_parsing_limits
    FOR UPDATE USING (auth.uid() = user_id);

-- Polityka dla tags (publiczny odczyt)
CREATE POLICY tags_select_active ON tags
    FOR SELECT USING (is_active = TRUE);
```

## 5. Dodatkowe uwagi i decyzje projektowe

### Triggery

```sql
-- Trigger dla automatycznej aktualizacji updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON tags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON collections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger dla tworzenia użytkownika po rejestracji w Supabase Auth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Funkcja do czyszczenia starych logów parsowania (>30 dni)
CREATE OR REPLACE FUNCTION clean_old_parsing_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM parsing_logs
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ language 'plpgsql';
```

### Funkcje pomocnicze

```sql
-- Funkcja do sprawdzania dziennego limitu parsowania
CREATE OR REPLACE FUNCTION check_parsing_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_count INTEGER;
BEGIN
    -- Utwórz rekord jeśli nie istnieje
    INSERT INTO daily_parsing_limits (user_id, date, count)
    VALUES (p_user_id, CURRENT_DATE, 0)
    ON CONFLICT (user_id, date) DO NOTHING;

    -- Pobierz aktualną liczbę
    SELECT count INTO current_count
    FROM daily_parsing_limits
    WHERE user_id = p_user_id AND date = CURRENT_DATE;

    RETURN current_count < 100;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Funkcja do inkrementacji licznika parsowania
CREATE OR REPLACE FUNCTION increment_parsing_count(p_user_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE daily_parsing_limits
    SET count = count + 1
    WHERE user_id = p_user_id AND date = CURRENT_DATE;
END;
$$ language 'plpgsql' SECURITY DEFINER;
```

### Storage Buckets

```sql
-- Konfiguracja Supabase Storage
-- Bucket: recipe-images
-- Polityki:
-- - Publiczny odczyt dla wszystkich
-- - Prywatny zapis tylko dla zalogowanych użytkowników
-- - Użytkownik może zapisywać tylko w folderze user_id/{user_id}/
```

### Seed Data

```sql
-- Podstawowe tagi
INSERT INTO tags (name, slug) VALUES
    ('Śniadanie', 'sniadanie'),
    ('Obiad', 'obiad'),
    ('Kolacja', 'kolacja'),
    ('Deser', 'deser'),
    ('Przekąska', 'przekaska'),
    ('Wegańskie', 'weganskie'),
    ('Wegetariańskie', 'wegetarianskie'),
    ('Bezglutenowe', 'bezglutenowe'),
    ('Szybkie', 'szybkie'),
    ('Zupa', 'zupa'),
    ('Sałatka', 'salatka'),
    ('Ciasto', 'ciasto'),
    ('Napój', 'napoj'),
    ('Smoothie', 'smoothie'),
    ('Makaron', 'makaron'),
    ('Ryż', 'ryz'),
    ('Mięsne', 'miesne'),
    ('Rybne', 'rybne'),
    ('Owoce morza', 'owoce-morza'),
    ('Grill', 'grill');
```

### Uwagi implementacyjne

1. **Przechowywanie składników i kroków jako arrays (TEXT[])** - Wybrano to rozwiązanie dla prostoty MVP, choć w przyszłości może być rozważona normalizacja do osobnych tabel.

2. **JSONB dla metadanych** - Umożliwia elastyczne przechowywanie dodatkowych informacji bez zmiany schematu.

3. **Soft delete dla tagów** - Pozwala na zachowanie integralności danych przy dezaktywacji tagów.

4. **Rate limiting na poziomie bazy** - Implementacja w bazie danych zapewnia spójność niezależnie od warstwy aplikacji.

5. **Hash checking dla zdjęć** - Indeks na image_hash pomaga w wykrywaniu duplikatów przy uploading.

6. **Eager loading strategia** - Zdjęcia są pobierane i przechowywane lokalnie w Storage podczas importu.

7. **Przygotowanie na kolekcje** - Struktura tabel collections i recipe_collections jest gotowa na przyszłe funkcje współdzielenia.

8. **Automatyczne czyszczenie logów** - Wymaga konfiguracji pg_cron w Supabase dla regularnego wywoływania clean_old_parsing_logs().

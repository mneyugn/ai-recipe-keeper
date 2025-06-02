# REST API Plan

## 1. Resources

- **Users** → `users` table (managed by Supabase Auth)
- **Recipes** → `recipes` table
- **Tags** → `tags` table
- **Recipe Tags** → `recipe_tags` table
- **Recipe Extraction** → `extraction_logs` table
- **Collections** → `collections` table (prepared for future features)
- **Recipe Collections** → `recipe_collections` table (prepared for future features)

## 2. Endpoints

### User Profile Endpoints

#### GET /api/users/profile

Get current user profile

- **Request headers:** Authorization: Bearer {token}
- **Response payload:**

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "johndoe",
  "is_admin": false,
  "created_at": "2024-01-15T10:00:00Z",
  "recipe_count": 42,
  "extraction_limit": {
    "used": 5,
    "limit": 100,
    "date": "2024-01-15"
  }
}
```

- **Success codes:** 200 OK
- **Error codes:** 401 Unauthorized

### Recipe Endpoints

#### GET /api/recipes

List user's recipes

- **Request headers:** Authorization: Bearer {token}
- **Query parameters:**
  - `page` (integer, default: 1)
  - `limit` (integer, default: 20, max: 100)
  - `sort` (string, default: "created_at:desc", options: "created_at:asc", "created_at:desc", "name:asc", "name:desc")
  - `tag` (string, optional) - Filter by tag slug
- **Response payload:**

```json
{
  "recipes": [
    {
      "id": "uuid",
      "name": "Spaghetti Carbonara",
      "image_url": "https://storage.url/image.jpg",
      "preparation_time": "30 minutes",
      "tags": ["obiad", "makaron"],
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "total_pages": 3
  }
}
```

- **Success codes:** 200 OK
- **Error codes:** 401 Unauthorized

#### GET /api/recipes/{id}

Get recipe details

- **Request headers:** Authorization: Bearer {token}
- **Response payload:**

```json
{
  "id": "uuid",
  "name": "Spaghetti Carbonara",
  "ingredients": ["400g spaghetti", "200g pancetta", "4 eggs", "100g parmesan cheese"],
  "steps": [
    "Boil water and cook spaghetti",
    "Fry pancetta until crispy",
    "Mix eggs with parmesan",
    "Combine all ingredients"
  ],
  "preparation_time": "30 minutes",
  "source_type": "manual",
  "source_url": null,
  "image_url": "https://storage.url/image.jpg",
  "notes": "Best served immediately",
  "tags": [
    {
      "id": "uuid",
      "name": "Obiad",
      "slug": "obiad"
    }
  ],
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z"
}
```

- **Success codes:** 200 OK
- **Error codes:**
  - 401 Unauthorized
  - 404 Not Found

#### POST /api/recipes

Create new recipe

- **Request headers:** Authorization: Bearer {token}
- **Request payload:**

```json
{
  "name": "Spaghetti Carbonara",
  "ingredients": ["400g spaghetti", "200g pancetta"],
  "steps": ["Boil water and cook spaghetti", "Fry pancetta until crispy"],
  "preparation_time": "30 minutes",
  "source_type": "manual",
  "source_url": null,
  "image_url": "https://storage.url/image.jpg",
  "notes": "Best served immediately",
  "tag_ids": ["uuid1", "uuid2"]
}
```

- **Response payload:** Same as GET /api/recipes/{id}
- **Success codes:** 201 Created
- **Error codes:**
  - 401 Unauthorized
  - 400 Bad Request - Validation errors

#### PUT /api/recipes/{id}

Update recipe

- **Request headers:** Authorization: Bearer {token}
- **Request payload:** Same as POST /api/recipes
- **Response payload:** Same as GET /api/recipes/{id}
- **Success codes:** 200 OK
- **Error codes:**
  - 401 Unauthorized
  - 404 Not Found
  - 400 Bad Request - Validation errors

#### DELETE /api/recipes/{id}

Delete recipe

- **Request headers:** Authorization: Bearer {token}
- **Success codes:** 204 No Content
- **Error codes:**
  - 401 Unauthorized
  - 404 Not Found

### Recipe Extraction Endpoints

#### POST /api/recipe/extract-from-text

Extract recipe from text

- **Request headers:** Authorization: Bearer {token}
- **Request payload:**

```json
{
  "text": "Recipe text content here..."
}
```

- **Response payload:**

```json
{
  "extraction_log_id": "uuid",
  "extracted_data": {
    "name": "Detected Recipe Name",
    "ingredients": ["ingredient 1", "ingredient 2"],
    "steps": ["step 1", "step 2"],
    "preparation_time": "30 minutes",
    "suggested_tags": ["obiad", "makaron"]
  },
  "original_text": "Recipe text content here..."
}
```

- **Success codes:** 200 OK
- **Error codes:**
  - 401 Unauthorized
  - 400 Bad Request - Text too long (>10000 chars)
  - 429 Too Many Requests - Daily limit exceeded
  - 422 Unprocessable Entity - Could not extract recipe

#### POST /api/recipe/extract-from-url

Extract recipe from URL

- **Request headers:** Authorization: Bearer {token}
- **Request payload:**

```json
{
  "url": "https://aniagotuje.pl/recipe-url"
}
```

- **Response payload:**

```json
{
  "extraction_log_id": "uuid",
  "extracted_data": {
    "name": "Detected Recipe Name",
    "ingredients": ["ingredient 1", "ingredient 2"],
    "steps": ["step 1", "step 2"],
    "preparation_time": "30 minutes",
    "suggested_tags": ["obiad", "makaron"],
    "image_url": "https://scraped-image-url.jpg",
    "source_url": "https://aniagotuje.pl/recipe-url"
  }
}
```

- **Success codes:** 200 OK
- **Error codes:**
  - 401 Unauthorized
  - 400 Bad Request - Invalid or unsupported URL
  - 429 Too Many Requests - Daily limit exceeded
  - 422 Unprocessable Entity - Scraping or extraction failed

#### POST /api/recipe/extraction/{logId}/feedback

Submit extraction feedback

- **Request headers:** Authorization: Bearer {token}
- **Request payload:**

```json
{
  "feedback": "positive"
}
```

- **Success codes:** 204 No Content
- **Error codes:**
  - 401 Unauthorized
  - 404 Not Found - Extraction log not found
  - 400 Bad Request - Invalid feedback value

### Tag Endpoints

#### GET /api/tags

List all active tags

- **Response payload:**

```json
{
  "tags": [
    {
      "id": "uuid",
      "name": "Śniadanie",
      "slug": "sniadanie"
    },
    {
      "id": "uuid",
      "name": "Obiad",
      "slug": "obiad"
    }
  ]
}
```

- **Success codes:** 200 OK
- **Note:** Public endpoint, no authentication required

### Image upload endpoints

#### POST /api/upload/recipe-image

Upload recipe image

- **Request headers:**
  - Authorization: Bearer {token}
  - Content-Type: multipart/form-data
- **Request body:** Form data with `image` file field
- **Response payload:**

```json
{
  "url": "https://storage.url/user_id/uuid/filename.jpg",
  "hash": "sha256hash"
}
```

- **Success codes:** 201 Created
- **Error codes:**
  - 401 Unauthorized
  - 400 Bad Request - Invalid file type or too large
  - 409 Conflict - Duplicate image (same hash exists)

## 3. Authentication and Authorization

### Authentication mechanism

- **Type:** JWT Bearer tokens via Supabase Auth
- **Header format:** `Authorization: Bearer {access_token}`
- **Token expiration:** 1 hour for access tokens
- **Refresh mechanism:** Use refresh token to obtain new access token

**Note:** Authentication endpoints (register, login, logout, password reset) are handled directly by Supabase Auth API, not by custom endpoints. The frontend should use Supabase Client SDK to interact with these auth endpoints:

- Sign up: `supabase.auth.signUp()`
- Sign in: `supabase.auth.signInWithPassword()`
- Sign out: `supabase.auth.signOut()`
- Reset password: `supabase.auth.resetPasswordForEmail()`

### Authorization Rules

- All recipe endpoints require authentication
- Users can only access their own recipes (enforced by RLS)
- Recipe extraction endpoints require authentication and check daily limits
- Tags endpoint is public (read-only)
- Admin-only endpoints are not exposed in MVP

### Session Management

- Sessions managed by Supabase Auth
- Refresh tokens stored securely client-side
- Automatic token refresh before expiration

## 4. Validation and Business Logic

### Recipe validation

- **name:** Required, non-empty string
- **ingredients:** Required array, 1-50 items, max 200 characters per item
- **steps:** Required array, 1-50 items, max 2000 characters per item
- **preparation_time:** Optional string
- **source_type:** Must be one of: 'manual', 'url', 'text'
- **source_url:** Required when source_type is 'url'
- **notes:** Optional, max 5000 characters
- **tag_ids:** Optional array of valid tag UUIDs

### Text extraction validation

- **text:** Required, max 10000 characters
- Daily limit check before processing (100 per user per day)
- Increment counter after successful extraction

### URL extraction validation

- **url:** Required, must be from aniagotuje.pl or kwestiasmaku.com
- Daily limit check before processing
- Validate URL format and domain
- Handle scraper failures gracefully

### User registration validation

- **email:** Required, valid email format, unique
- **username:** Required, 3-50 characters, alphanumeric + underscore, unique
- **password:** Required, minimum 8 characters

### Feedback validation

- **feedback:** Must be either 'positive' or 'negative'
- Can only provide feedback for own extraction logs
- Can only provide feedback once per extraction log

### Business logic implementation

#### Daily extraction limits

- Check limit using `check_extraction_limit(user_id)` database function
- Return 429 if limit exceeded
- Increment counter using `increment_extraction_count(user_id)` after successful extraction

#### Recipe source tracking

- Automatically set source_type based on creation method:
  - 'manual' for direct recipe creation
  - 'text' for text extraction
  - 'url' for URL import
- Preserve original URL for imported recipes

#### Image handling

- Store images in Supabase Storage bucket: `recipe-images`
- Path format: `user_id/{user_id}/{uuid}/{filename}`
- Check for duplicate images using hash
- Validate file types: jpg, jpeg, png, webp
- Max file size: 5MB

#### Tag management

- Only predefined tags can be assigned
- Tags must be active (`is_active = true`)
- Validate tag IDs exist before assignment

#### Error response format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error message",
    "details": {
      "field": "Specific validation error"
    }
  }
}
```

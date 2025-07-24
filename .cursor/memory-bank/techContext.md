# Tech Context: AI Recipe Keeper

## 1. Core Technologies

- **Framework:** [Astro 5](https://astro.build/)
- **UI Library:** [React 19](https://react.dev/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Components:** [Shadcn/ui](https://ui.shadcn.com/)
- **Language:** [TypeScript 5](https://www.typescriptlang.org/)
- **Database & Auth:** [Supabase](https://supabase.com/)
- **AI Integration:** [OpenRouter](https://openrouter.ai/)
- **Testing:** [Playwright](https://playwright.dev/) for E2E tests, [Vitest](https://vitest.dev/) for unit tests.

## 2. Development Environment

- **Environment Variables:** Create a `.env` file based on `.env.example` and populate it with your Supabase and OpenRouter credentials.
- **Running the App:** `npm run dev`
- **Running Tests:** `npm run test` (for unit tests) and `npm run test:e2e` (for end-to-end tests).

## 3. Technical Constraints

- **Stateless Backend:** API routes are serverless and should be treated as stateless.
- **Supabase RLS:** Row Level Security is enabled in Supabase. All data access policies are defined in SQL migrations and enforced by the database.
- **AI Model Dependency:** The quality of recipe extraction is dependent on the performance of the underlying language model selected via OpenRouter.

## 4. Key Dependencies

- `astro`: Core framework.
- `react`, `react-dom`: For interactive components.
- `@astrojs/tailwind`, `@astrojs/react`: Astro integrations.
- `@supabase/supabase-js`: Supabase client library.
- `zod`: For data validation.
- `tailwind-variants`: For styling component variants.

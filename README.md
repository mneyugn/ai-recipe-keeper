# AI RecipeKeeper
 
A modern web application for digitizing, storing, and managing culinary recipes using artificial intelligence to automate the process of importing recipes from various sources.

## Table of Contents

- [AI RecipeKeeper](#ai-recipekeeper)
  - [Table of Contents](#table-of-contents)
  - [Project Description](#project-description)
    - [Key Features](#key-features)
    - [Supported Sources](#supported-sources)
  - [Tech Stack](#tech-stack)
    - [Frontend](#frontend)
    - [Backend](#backend)
    - [Development \& Deployment](#development--deployment)
    - [Testing](#testing)
  - [Getting Started Locally](#getting-started-locally)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
  - [Available Scripts](#available-scripts)
  - [Project Scope](#project-scope)
    - [MVP Features (Current Scope)](#mvp-features-current-scope)
    - [Future Enhancements (Not in MVP)](#future-enhancements-not-in-mvp)
  - [Project Status](#project-status)
    - [Success Metrics](#success-metrics)
  - [License](#license)

## Project Description

AI RecipeKeeper is designed to streamline the process of digitizing and organizing culinary recipes. The application leverages LLMs to automatically extract and structure recipe data from text inputs and supported cooking websites, significantly reducing the time users spend manually transcribing recipes.

### Key Features

- **AI-Powered Recipe Parsing**: Automatically extract recipe structure (ingredients, steps, tags, timing) from pasted text
- **URL Import Support**: Import recipes directly from aniagotuje.pl and kwestiasmaku.com
- **Recipe Management**: Full CRUD operations for personal recipe collection
- **User Authentication**: Secure account system with password recovery
- **Private Collections**: All recipes are private and accessible only to the recipe owner
- **Quality Feedback**: Rate AI parsing quality to help improve the system

### Supported Sources

- Manual text input (up to 10,000 characters)
- aniagotuje.pl
- kwestiasmaku.com

## Tech Stack

### Frontend

- **Astro 5**
- **React 19**
- **TypeScript 5**
- **Tailwind CSS 4**
- **Shadcn/ui**

### Backend

- **Supabase**
- **Openrouter.ai**

### Development & Deployment

- **Node.js 22.14.0**
- **GitHub Actions**
- **DigitalOcean**

### Testing

- **Vitest** (Unit Tests)
- **Playwright** (E2E Tests)

## Getting Started Locally

### Prerequisites

- Node.js 22.14.0 (use .nvmrc for version management)
- npm or yarn package manager

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/mneyugn/ai-recipe-keeper.git
   cd ai-recipe-keeper
   ```

2. **Use the correct Node.js version**

   ```bash
   nvm use
   ```

3. **Install dependencies**

   ```bash
   npm install
   ```

4. **Environment Setup**

   Copy the example environment file and configure your variables:

   ```bash
   cp .env.example .env
   ```

   Configure the following environment variables:

   - Supabase configuration (URL, API keys)
   - Openrouter.ai API key
   - Other application-specific settings

5. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:4321`

## Available Scripts

| Script     | Command              | Description                              |
| ---------- | -------------------- | ---------------------------------------- |
| `dev`      | `astro dev`          | Start development server with hot reload |
| `build`    | `astro build`        | Build the application for production     |
| `preview`  | `astro preview`      | Preview the production build locally     |
| `astro`    | `astro`              | Run Astro CLI commands                   |
| `lint`     | `eslint .`           | Run ESLint to check code quality         |
| `lint:fix` | `eslint . --fix`     | Run ESLint and automatically fix issues  |
| `format`   | `prettier --write .` | Format code using Prettier               |

## Project Scope

### MVP Features (Current Scope)

- ✅ User account management (registration, login, password recovery)
- ✅ AI-powered recipe parsing from text input
- ✅ Recipe import from supported websites (aniagotuje.pl, kwestiasmaku.com)
- ✅ Recipe verification and editing interface
- ✅ Manual recipe creation
- ✅ Complete recipe CRUD operations
- ✅ Private recipe collections
- ✅ Recipe listing with thumbnails and basic information
- ✅ AI parsing quality feedback system

### Future Enhancements (Not in MVP)

- Advanced meal planning with macronutrients and calories
- Virtual pantry and recipe suggestions based on available ingredients
- Universal web scraper for any cooking website
- Shopping list generation
- Social features (sharing, comments, ratings)
- Automatic portion scaling
- Nutritional analysis
- AI-generated recipe images
- Mobile applications (iOS, Android)
- Photo/scan recipe import
- Advanced search and filtering
- Custom tags and drag-and-drop editing

## Project Status

🚧 **MVP Development Phase**

This project is currently in active development as a Minimum Viable Product (MVP). Core functionality for recipe digitization and management is being implemented.

### Success Metrics

- **AI Parsing Accuracy**: 70%+ correct field identification for well-formatted text recipes
- **URL Import Success**: 80%+ successful imports from supported websites
- **User Experience**: Users can successfully add, manage, and retrieve 10+ recipes using multiple input methods

## License

This project is licensed under the [MIT License](LICENSE) - see the LICENSE file for details.

---

**Note**: This is an MVP version focused on core recipe digitization and management features. Additional functionality will be considered for future releases based on user feedback and project requirements.

import { test, expect } from "@playwright/test";
import { RecipeFormPage } from "../pages/RecipeFormPage";
import { LoginPage } from "../pages/LoginPage";

test.describe("Recipe Form - Manual Creation", () => {
  let recipeFormPage: RecipeFormPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    recipeFormPage = new RecipeFormPage(page);
    loginPage = new LoginPage(page);

    // Zaloguj użytkownika przed każdym testem
    const email = process.env.E2E_EMAIL;
    const password = process.env.E2E_PASSWORD;

    if (!email || !password) {
      throw new Error("Zmienne środowiskowe E2E_EMAIL i E2E_PASSWORD muszą być ustawione");
    }

    await loginPage.goto();
    await loginPage.waitForPageLoad();
    await loginPage.login(email, password);

    // Poczekaj na przekierowanie po logowaniu
    await expect(page).toHaveURL(/\/recipes/);

    // Przejdź do formularza dodawania przepisu
    await recipeFormPage.goto();
  });

  test("should display manual recipe form correctly", async () => {
    // Check if the form is visible
    await recipeFormPage.expectFormToBeVisible();

    // Check if the manual tab is available
    await recipeFormPage.clickManualTab();
    await recipeFormPage.expectManualContentToBeVisible();
    await recipeFormPage.expectManualTabToBeActive();

    // Check if the submit button is available
    await recipeFormPage.expectSubmitButtonToBeEnabled();
    await recipeFormPage.expectSubmitButtonText("Zapisz przepis");

    // Check if the default fields for ingredients and steps are available
    await recipeFormPage.expectIngredientsCount(1);
    await recipeFormPage.expectStepsCount(1);
  });

  test("should successfully create a simple recipe", async ({ page }) => {
    const recipeData = {
      name: "Jajecznica na maśle",
      ingredients: ["3 jajka", "2 łyżki masła", "sól do smaku", "pieprz do smaku"],
      steps: [
        "Rozbij jajka do miski i roztrzep widelcem",
        "Rozgrzej masło na patelni na średnim ogniu",
        "Wlej jajka na patelnię i mieszaj drewnianą łyżką",
        "Dopraw solą i pieprzem, mieszaj aż jajka się zetną",
      ],
      preparationTime: "10 minut",
      notes: "Podawać najlepiej na świeżym chlebie",
    };

    // Fill the form
    await recipeFormPage.fillCompleteRecipe(recipeData);

    // Check if the data has been entered correctly
    await recipeFormPage.expectRecipeNameValue(recipeData.name);
    await recipeFormPage.expectPreparationTimeValue(recipeData.preparationTime);
    await recipeFormPage.expectNotesValue(recipeData.notes);

    // Check the ingredients
    for (let i = 0; i < recipeData.ingredients.length; i++) {
      await recipeFormPage.expectIngredientValue(i, recipeData.ingredients[i]);
    }

    // Check the steps
    for (let i = 0; i < recipeData.steps.length; i++) {
      await recipeFormPage.expectStepValue(i, recipeData.steps[i]);
    }

    // Submit the form
    await recipeFormPage.clickSubmit();

    // Check if the user is redirected to the recipe details page
    await expect(page).toHaveURL(/\/recipes\/[a-f0-9-]+$/);
  });

  test("should add and remove ingredients dynamically", async () => {
    await recipeFormPage.clickManualTab();

    // Check the initial state - 1 ingredient
    await recipeFormPage.expectIngredientsCount(1);

    // Add ingredients
    await recipeFormPage.fillIngredient(0, "Pierwszy składnik");
    await recipeFormPage.addIngredient();
    await recipeFormPage.expectIngredientsCount(2);

    await recipeFormPage.fillIngredient(1, "Drugi składnik");
    await recipeFormPage.addIngredient();
    await recipeFormPage.expectIngredientsCount(3);

    await recipeFormPage.fillIngredient(2, "Trzeci składnik");

    // Check the values
    await recipeFormPage.expectIngredientValue(0, "Pierwszy składnik");
    await recipeFormPage.expectIngredientValue(1, "Drugi składnik");
    await recipeFormPage.expectIngredientValue(2, "Trzeci składnik");

    // Remove the middle ingredient
    await recipeFormPage.removeIngredient(1);
    await recipeFormPage.expectIngredientsCount(2);

    // Check that the remaining ingredients are correct
    await recipeFormPage.expectIngredientValue(0, "Pierwszy składnik");
    await recipeFormPage.expectIngredientValue(1, "Trzeci składnik");
  });

  test("should add and remove steps dynamically", async () => {
    await recipeFormPage.clickManualTab();

    // Check the initial state - 1 step
    await recipeFormPage.expectStepsCount(1);

    // Add steps
    await recipeFormPage.fillStep(0, "Pierwszy krok");
    await recipeFormPage.addStep();
    await recipeFormPage.expectStepsCount(2);

    await recipeFormPage.fillStep(1, "Drugi krok");
    await recipeFormPage.addStep();
    await recipeFormPage.expectStepsCount(3);

    await recipeFormPage.fillStep(2, "Trzeci krok");

    // Check the values
    await recipeFormPage.expectStepValue(0, "Pierwszy krok");
    await recipeFormPage.expectStepValue(1, "Drugi krok");
    await recipeFormPage.expectStepValue(2, "Trzeci krok");

    // Remove the middle step
    await recipeFormPage.removeStep(1);
    await recipeFormPage.expectStepsCount(2);

    // Check that the remaining steps are correct
    await recipeFormPage.expectStepValue(0, "Pierwszy krok");
    await recipeFormPage.expectStepValue(1, "Trzeci krok");
  });

  test("should select and deselect tags", async ({ page }) => {
    await recipeFormPage.clickManualTab();

    // Check the initial state - no selected tags
    await recipeFormPage.expectSelectedTagsCount(0);

    // Open the tags dropdown
    await recipeFormPage.openTagsDropdown();

    // Select several tags (using popular slugs)
    await recipeFormPage.selectTag("sniadanie");
    await recipeFormPage.selectTag("makaron");
    await recipeFormPage.selectTag("szybkie");

    // Close the dropdown
    await page.keyboard.press("Escape");

    // Check if the tags have been selected
    await recipeFormPage.expectSelectedTagsCount(3);
    await recipeFormPage.expectTagToBeSelected("sniadanie");
    await recipeFormPage.expectTagToBeSelected("makaron");
    await recipeFormPage.expectTagToBeSelected("szybkie");

    // Remove one tag
    await recipeFormPage.deselectTag("makaron");
    await recipeFormPage.expectSelectedTagsCount(2);
    await recipeFormPage.expectTagToBeSelected("sniadanie");
    await recipeFormPage.expectTagToBeSelected("szybkie");
  });

  test("should show validation errors for empty required fields", async () => {
    await recipeFormPage.clickManualTab();

    // Try to submit an empty form
    await recipeFormPage.clickSubmit();

    // Check if validation errors have appeared
    await recipeFormPage.expectRecipeNameErrorToBeVisible();
    await recipeFormPage.expectRecipeNameErrorText("Nazwa potrawy jest wymagana");

    // Check if the form is still visible (not submitted)
    await recipeFormPage.expectFormToBeVisible();
  });

  test("should show validation errors for empty ingredients and steps", async () => {
    await recipeFormPage.clickManualTab();

    // Fill only the name
    await recipeFormPage.fillRecipeName("Test Recipe");

    // Leave ingredients and steps empty
    await recipeFormPage.fillIngredient(0, "");
    await recipeFormPage.fillStep(0, "");

    // Submit the form
    await recipeFormPage.clickSubmit();

    // Check validation errors
    await recipeFormPage.expectIngredientsErrorToBeVisible();
    await recipeFormPage.expectStepsErrorToBeVisible();
  });

  test("should create recipe with minimal required data", async ({ page }) => {
    const minimalRecipe = {
      name: "Minimalna Jajecznica",
      ingredients: ["jajka"],
      steps: ["Usmaż jajka"],
    };

    await recipeFormPage.fillCompleteRecipe(minimalRecipe);
    await recipeFormPage.clickSubmit();

    // Check if the recipe has been created
    await expect(page).toHaveURL(/\/recipes\/[a-f0-9-]+$/);
  });

  test("should create recipe with maximum data including tags", async ({ page }) => {
    const maximalRecipe = {
      name: "Pełna Jajecznica z Dodatkami",
      ingredients: [
        "6 jajek",
        "3 łyżki masła",
        "1 cebula",
        "200g boczku",
        "100g żółtego sera",
        "świeża pietruszka",
        "sól",
        "pieprz",
        "papryka słodka",
      ],
      steps: [
        "Pokrój cebulę w kostkę i podduś na maśle",
        "Dodaj pokrojony boczek i smaż do zarumienienia",
        "Rozbij jajka do miski, dopraw solą i pieprzem",
        "Wlej jajka na patelnię z cebulą i boczkiem",
        "Mieszaj łagodnie aż jajka się zetną",
        "Na koniec dodaj starty ser i posiekaną pietruszkę",
        "Posyp papryką i podawaj",
      ],
      preparationTime: "25 minut",
      notes: "Najlepiej podawać z chrupiącym chlebem i świeżymi warzywami. Można dodać pomidory lub awokado.",
      tags: ["sniadanie", "szybkie"],
    };

    await recipeFormPage.fillCompleteRecipe(maximalRecipe);

    // Check if
    await recipeFormPage.expectSelectedTagsCount(2);

    await recipeFormPage.clickSubmit();

    // Check if the recipe has been created
    await expect(page).toHaveURL(/\/recipes\/[a-f0-9-]+$/);
  });
});

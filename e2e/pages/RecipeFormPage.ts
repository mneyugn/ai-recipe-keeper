import { type Page, type Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class RecipeFormPage extends BasePage {
  // Main form locators
  private readonly recipeForm: Locator;
  private readonly formTabs: Locator;
  private readonly tabTriggerManual: Locator;
  private readonly tabTriggerText: Locator;
  private readonly tabTriggerUrl: Locator;
  private readonly manualModeContent: Locator;

  // Recipe basic info inputs
  private readonly recipeNameInput: Locator;
  private readonly preparationTimeInput: Locator;
  private readonly notesTextarea: Locator;

  // Error message locators
  private readonly recipeNameError: Locator;
  private readonly preparationTimeError: Locator;
  private readonly notesError: Locator;
  private readonly apiError: Locator;

  // Ingredients section
  private readonly ingredientsSection: Locator;
  private readonly ingredientsDynamicList: Locator;
  private readonly ingredientsItems: Locator;
  private readonly ingredientsAddButton: Locator;
  private readonly ingredientsError: Locator;

  // Steps section
  private readonly stepsSection: Locator;
  private readonly stepsDynamicList: Locator;
  private readonly stepsItems: Locator;
  private readonly stepsAddButton: Locator;
  private readonly stepsError: Locator;

  // Tags section
  private readonly tagsSection: Locator;
  private readonly tagsMultiSelect: Locator;
  private readonly tagsTrigger: Locator;
  private readonly tagsPopover: Locator;
  private readonly tagsSearch: Locator;
  private readonly tagsOptions: Locator;
  private readonly tagsSelectedTags: Locator;
  private readonly tagsError: Locator;

  // Submit
  private readonly submitButton: Locator;

  constructor(page: Page, path = "/recipes/new") {
    super(page, path);

    // Initialize main form locators
    this.recipeForm = this.page.getByTestId("recipe-form");
    this.formTabs = this.page.getByTestId("recipe-form-tabs");
    this.tabTriggerManual = this.page.getByTestId("tab-trigger-manual");
    this.tabTriggerText = this.page.getByTestId("tab-trigger-text");
    this.tabTriggerUrl = this.page.getByTestId("tab-trigger-url");
    this.manualModeContent = this.page.getByTestId("manual-mode-content");

    // Initialize recipe basic info inputs
    this.recipeNameInput = this.page.getByTestId("recipe-name-input");
    this.preparationTimeInput = this.page.getByTestId("preparation-time-input");
    this.notesTextarea = this.page.getByTestId("notes-textarea");

    // Initialize error message locators
    this.recipeNameError = this.page.getByTestId("recipe-name-error");
    this.preparationTimeError = this.page.getByTestId("preparation-time-error");
    this.notesError = this.page.getByTestId("notes-error");
    this.apiError = this.page.getByTestId("api-error");

    // Initialize ingredients section
    this.ingredientsSection = this.page.getByTestId("ingredients-section");
    this.ingredientsDynamicList = this.page.getByTestId("ingredients-dynamic-list");
    this.ingredientsItems = this.page.getByTestId("ingredients-dynamic-list-items");
    this.ingredientsAddButton = this.page.getByTestId("ingredients-dynamic-list-add-button");
    this.ingredientsError = this.page.getByTestId("ingredients-dynamic-list-error");

    // Initialize steps section
    this.stepsSection = this.page.getByTestId("steps-section");
    this.stepsDynamicList = this.page.getByTestId("steps-dynamic-list");
    this.stepsItems = this.page.getByTestId("steps-dynamic-list-items");
    this.stepsAddButton = this.page.getByTestId("steps-dynamic-list-add-button");
    this.stepsError = this.page.getByTestId("steps-dynamic-list-error");

    // Initialize tags section
    this.tagsSection = this.page.getByTestId("tags-section");
    this.tagsMultiSelect = this.page.getByTestId("tags-multi-select");
    this.tagsTrigger = this.page.getByTestId("tags-multi-select-trigger");
    this.tagsPopover = this.page.getByTestId("tags-multi-select-popover");
    this.tagsSearch = this.page.getByTestId("tags-multi-select-search");
    this.tagsOptions = this.page.getByTestId("tags-multi-select-options");
    this.tagsSelectedTags = this.page.getByTestId("tags-multi-select-selected-tags");
    this.tagsError = this.page.getByTestId("tags-error");

    // Initialize submit
    this.submitButton = this.page.getByTestId("submit-button");
  }

  // Navigation actions
  async clickManualTab(): Promise<void> {
    await expect(async () => {
      await this.clickElement(this.tabTriggerManual);
      await expect(this.tabTriggerManual).toHaveAttribute("data-state", "active");
    }).toPass();
  }

  async clickTextTab(): Promise<void> {
    await expect(async () => {
      await this.clickElement(this.tabTriggerText);
      await expect(this.tabTriggerText).toHaveAttribute("data-state", "active");
    }).toPass();
  }

  async clickUrlTab(): Promise<void> {
    await expect(async () => {
      await this.clickElement(this.tabTriggerUrl);
      await expect(this.tabTriggerUrl).toHaveAttribute("data-state", "active");
    }).toPass();
  }

  // Basic form actions
  async fillRecipeName(name: string): Promise<void> {
    await this.fillInput(this.recipeNameInput, name);
  }

  async fillPreparationTime(time: string): Promise<void> {
    await this.fillInput(this.preparationTimeInput, time);
  }

  async fillNotes(notes: string): Promise<void> {
    await this.fillInput(this.notesTextarea, notes);
  }

  async clickSubmit(): Promise<void> {
    await expect(async () => {
      await expect(this.submitButton).toBeEnabled();
      await this.clickElement(this.submitButton);
    }).toPass();
  }

  // Ingredients actions
  async getIngredientInput(index: number): Promise<Locator> {
    return this.page.getByTestId(`ingredients-dynamic-list-input-${index}`);
  }

  async fillIngredient(index: number, ingredient: string): Promise<void> {
    const input = await this.getIngredientInput(index);
    await this.fillInput(input, ingredient);
  }

  async addIngredient(): Promise<void> {
    await this.clickElement(this.ingredientsAddButton);
  }

  async removeIngredient(index: number): Promise<void> {
    const removeButton = this.page.getByTestId(`ingredients-dynamic-list-remove-${index}`);
    await this.clickElement(removeButton);
  }

  async fillMultipleIngredients(ingredients: string[]): Promise<void> {
    for (let i = 0; i < ingredients.length; i++) {
      if (i > 0) {
        await this.addIngredient();
      }
      await this.fillIngredient(i, ingredients[i]);
    }
  }

  // Steps actions
  async getStepTextarea(index: number): Promise<Locator> {
    return this.page.getByTestId(`steps-dynamic-list-textarea-${index}`);
  }

  async fillStep(index: number, step: string): Promise<void> {
    const textarea = await this.getStepTextarea(index);
    await this.fillInput(textarea, step);
  }

  async addStep(): Promise<void> {
    await this.clickElement(this.stepsAddButton);
  }

  async removeStep(index: number): Promise<void> {
    const removeButton = this.page.getByTestId(`steps-dynamic-list-remove-${index}`);
    await this.clickElement(removeButton);
  }

  async fillMultipleSteps(steps: string[]): Promise<void> {
    for (let i = 0; i < steps.length; i++) {
      if (i > 0) {
        await this.addStep();
      }
      await this.fillStep(i, steps[i]);
    }
  }

  // Tags actions
  async openTagsDropdown(): Promise<void> {
    await this.clickElement(this.tagsTrigger);
  }

  async searchTags(query: string): Promise<void> {
    await this.fillInput(this.tagsSearch, query);
  }

  async selectTag(tagSlug: string): Promise<void> {
    const tagOption = this.page.getByTestId(`tags-multi-select-option-${tagSlug}`);
    await this.clickElement(tagOption);
  }

  async deselectTag(tagSlug: string): Promise<void> {
    const selectedTag = this.page.getByTestId(`tags-multi-select-selected-tag-${tagSlug}`);
    await this.clickElement(selectedTag);
  }

  async selectMultipleTags(tagSlugs: string[]): Promise<void> {
    await this.openTagsDropdown();
    for (const tagSlug of tagSlugs) {
      await this.selectTag(tagSlug);
    }
    // Close dropdown by clicking outside
    await this.page.keyboard.press("Escape");
  }

  // Complete recipe form filling
  async fillCompleteRecipe(recipeData: {
    name: string;
    ingredients: string[];
    steps: string[];
    preparationTime?: string;
    notes?: string;
    tags?: string[];
  }): Promise<void> {
    await this.clickManualTab();
    await this.fillRecipeName(recipeData.name);
    await this.fillMultipleIngredients(recipeData.ingredients);
    await this.fillMultipleSteps(recipeData.steps);

    if (recipeData.preparationTime) {
      await this.fillPreparationTime(recipeData.preparationTime);
    }

    if (recipeData.notes) {
      await this.fillNotes(recipeData.notes);
    }

    if (recipeData.tags && recipeData.tags.length > 0) {
      await this.selectMultipleTags(recipeData.tags);
    }
  }

  // Assertions - Form visibility
  async expectFormToBeVisible(): Promise<void> {
    await this.expectToBeVisible(this.recipeForm);
  }

  async expectManualTabToBeActive(): Promise<void> {
    await expect(this.tabTriggerManual).toHaveAttribute("data-state", "active");
  }

  async expectManualContentToBeVisible(): Promise<void> {
    await this.expectToBeVisible(this.manualModeContent);
  }

  // Assertions - Input values
  async expectRecipeNameValue(name: string): Promise<void> {
    await expect(this.recipeNameInput).toHaveValue(name);
  }

  async expectPreparationTimeValue(time: string): Promise<void> {
    await expect(this.preparationTimeInput).toHaveValue(time);
  }

  async expectNotesValue(notes: string): Promise<void> {
    await expect(this.notesTextarea).toHaveValue(notes);
  }

  async expectIngredientValue(index: number, ingredient: string): Promise<void> {
    const input = await this.getIngredientInput(index);
    await expect(input).toHaveValue(ingredient);
  }

  async expectStepValue(index: number, step: string): Promise<void> {
    const textarea = await this.getStepTextarea(index);
    await expect(textarea).toHaveValue(step);
  }

  // Assertions - Error messages
  async expectRecipeNameErrorToBeVisible(): Promise<void> {
    await this.expectToBeVisible(this.recipeNameError);
  }

  async expectIngredientsErrorToBeVisible(): Promise<void> {
    await this.expectToBeVisible(this.ingredientsError);
  }

  async expectStepsErrorToBeVisible(): Promise<void> {
    await this.expectToBeVisible(this.stepsError);
  }

  async expectApiErrorToBeVisible(): Promise<void> {
    await this.expectToBeVisible(this.apiError);
  }

  async expectRecipeNameErrorText(text: string): Promise<void> {
    await this.expectToHaveText(this.recipeNameError, text);
  }

  async expectApiErrorText(text: string): Promise<void> {
    await this.expectToHaveText(this.apiError, text);
  }

  // Assertions - Submit button
  async expectSubmitButtonToBeEnabled(): Promise<void> {
    await expect(this.submitButton).toBeEnabled();
  }

  async expectSubmitButtonToBeDisabled(): Promise<void> {
    await expect(this.submitButton).toBeDisabled();
  }

  async expectSubmitButtonText(text: string): Promise<void> {
    await this.expectToHaveText(this.submitButton, text);
  }

  // Assertions - Dynamic lists
  async expectIngredientsCount(count: number): Promise<void> {
    const ingredients = this.page.getByTestId(/^ingredients-dynamic-list-item-\d+$/);
    await expect(ingredients).toHaveCount(count);
  }

  async expectStepsCount(count: number): Promise<void> {
    const steps = this.page.getByTestId(/^steps-dynamic-list-item-\d+$/);
    await expect(steps).toHaveCount(count);
  }

  // Assertions - Tags
  async expectTagToBeSelected(tagSlug: string): Promise<void> {
    const selectedTag = this.page.getByTestId(`tags-multi-select-selected-tag-${tagSlug}`);
    await this.expectToBeVisible(selectedTag);
  }

  async expectSelectedTagsCount(count: number): Promise<void> {
    if (count === 0) {
      await expect(this.tagsSelectedTags).toBeHidden();
    } else {
      const selectedTags = this.page.getByTestId(/^tags-multi-select-selected-tag-.+$/);
      await expect(selectedTags).toHaveCount(count);
    }
  }

  // Getters for direct access to locators if needed
  get getRecipeForm(): Locator {
    return this.recipeForm;
  }

  get getSubmitButton(): Locator {
    return this.submitButton;
  }

  get getApiError(): Locator {
    return this.apiError;
  }

  get getRecipeNameInput(): Locator {
    return this.recipeNameInput;
  }
}

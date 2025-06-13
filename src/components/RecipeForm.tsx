import React, { useState, useEffect } from "react";
import { z } from "zod";
import type {
  RecipeDetailDTO,
  RecipeSourceType,
  TagDTO,
  ExtractFromTextResponseDTO,
  ExtractFromUrlResponseDTO,
  FeedbackType,
  CreateRecipeCommand,
  UpdateRecipeCommand,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertTriangle, Eye, EyeOff, RefreshCw } from "lucide-react";
import DynamicFieldList from "@/components/DynamicFieldList";
import MultiSelectTags from "@/components/MultiSelectTags";
import AiFeedbackButtons from "@/components/AiFeedbackButtons";

// Funkcja do pobierania tagów z API
const fetchTags = async (): Promise<TagDTO[]> => {
  try {
    const response = await fetch("/api/tags");
    if (!response.ok) {
      console.error("Błąd podczas pobierania tagów:", response.status);
      return [];
    }
    const data = await response.json();
    return data.tags || [];
  } catch (error) {
    console.error("Błąd podczas pobierania tagów:", error);
    return [];
  }
};

// Schemat walidacji Zod
const recipeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nazwa potrawy jest wymagana").max(255, "Nazwa potrawy nie może przekraczać 255 znaków"),
  ingredients: z
    .array(z.string())
    .min(1, "Wymagany jest co najmniej jeden składnik")
    .max(50, "Maksymalna liczba składników to 50")
    .refine((ingredients) => ingredients.every((i) => i.trim().length > 0), "Składniki nie mogą być puste")
    .refine((ingredients) => ingredients.every((i) => i.length <= 200), "Składnik nie może przekraczać 200 znaków"),
  steps: z
    .array(z.string())
    .min(1, "Wymagany jest co najmniej jeden krok")
    .max(50, "Maksymalna liczba kroków to 50")
    .refine((steps) => steps.every((s) => s.trim().length > 0), "Kroki nie mogą być puste")
    .refine((steps) => steps.every((s) => s.length <= 2000), "Krok nie może przekraczać 2000 znaków"),
  preparation_time: z.string().max(100, "Czas przygotowania nie może przekraczać 100 znaków").optional(),
  source_type: z.enum(["manual", "url", "text"] as const),
  source_url: z.string().optional(),
  image_url: z.string().optional(),
  notes: z.string().max(5000, "Notatki nie mogą przekraczać 5000 znaków").optional(),
  tag_ids: z.array(z.string()).max(10, "Możesz wybrać maksymalnie 10 tagów"),
  rawTextToProcess: z.string().max(10000, "Tekst nie może przekraczać 10000 znaków").optional(),
  originalRawText: z.string().optional(),
  isOriginalTextVisible: z.boolean().optional(),
  urlToImport: z.string().optional(),
  extractionLogId: z.string().nullable(),
  aiFeedback: z.enum(["positive", "negative"]).nullable(),
});

type RecipeFormData = z.infer<typeof recipeSchema>;

interface RecipeFormProps {
  recipeData?: RecipeDetailDTO | null; // Data for editing, null for new
  recipeId?: string; // Explicit recipeId for edit mode consistency
  mode: "new" | "edit";
}

const RecipeForm: React.FC<RecipeFormProps> = ({ recipeData, mode, recipeId }) => {
  const initialFormData: RecipeFormData = {
    id: recipeData?.id || undefined,
    name: recipeData?.name || "",
    ingredients: recipeData?.ingredients || [""], // Start with one empty ingredient
    steps: recipeData?.steps || [""], // Start with one empty step
    preparation_time: recipeData?.preparation_time || "",
    source_type: (recipeData?.source_type as RecipeSourceType) || "manual",
    source_url: recipeData?.source_url || "",
    image_url: recipeData?.image_url || "",
    notes: recipeData?.notes || "",
    tag_ids: recipeData?.tags?.map((tag) => tag.id) || [],
    rawTextToProcess: "",
    originalRawText: "",
    isOriginalTextVisible: false,
    urlToImport: "",
    extractionLogId: null,
    aiFeedback: null,
  };

  const [formData, setFormData] = useState<RecipeFormData>(initialFormData);
  const [currentMode, setCurrentMode] = useState<"manual" | "text" | "url">("url");
  const [isLoading, setIsLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [availableTags, setAvailableTags] = useState<TagDTO[]>([]);
  const [showReprocessDialog, setShowReprocessDialog] = useState(false);

  useEffect(() => {
    console.log("RecipeForm mounted, mode:", mode, "recipeId:", recipeId);
    if (mode === "edit" && recipeData) {
      console.log("Populating form with recipeData:", recipeData);
    }
  }, [mode, recipeData, recipeId]);

  useEffect(() => {
    const loadTags = async () => {
      const tags = await fetchTags();
      setAvailableTags(tags);
    };

    loadTags();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Czyścimy błąd dla pola po jego zmianie
    if (formErrors[name]) {
      setFormErrors((prev) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [name]: removed, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleExtractFromText = async () => {
    if (!formData.rawTextToProcess?.trim()) {
      setFormErrors({ rawTextToProcess: "Wprowadź tekst przepisu do przetworzenia" });
      return;
    }

    setIsExtracting(true);
    setFormErrors({});

    try {
      const response = await fetch("/api/recipe/extract-from-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: formData.rawTextToProcess,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (response.status === 429) {
          setFormErrors({
            api: "Przekroczono dzienny limit ekstrakcji (100/dzień). Spróbuj ponownie jutro.",
          });
        } else if (response.status === 422 || response.status === 500) {
          setFormErrors({
            api: "Nie udało się przetworzyć przepisu z podanego tekstu. Spróbuj ponownie lub wprowadź dane manualnie.",
          });
        } else {
          setFormErrors({
            api: errorData.error?.message || "Wystąpił błąd podczas przetwarzania tekstu.",
          });
        }
        return;
      }

      const extractionResponse: ExtractFromTextResponseDTO = await response.json();

      // Wypełnianie formularza danymi z ekstrakcji
      setFormData((prev) => ({
        ...prev,
        name: extractionResponse.extracted_data.name,
        ingredients: extractionResponse.extracted_data.ingredients,
        steps: extractionResponse.extracted_data.steps,
        preparation_time: extractionResponse.extracted_data.preparation_time || "",
        source_type: "text" as RecipeSourceType,
        originalRawText: extractionResponse.original_text,
        extractionLogId: extractionResponse.extraction_log_id,
        aiFeedback: null,
      }));

      // Ustaw sugerowane tagi
      const suggestedTagIds = availableTags
        .filter((tag) => extractionResponse.extracted_data.suggested_tags?.includes(tag.slug))
        .map((tag) => tag.id);

      if (suggestedTagIds.length > 0) {
        setFormData((prev) => ({
          ...prev,
          tag_ids: [...new Set([...prev.tag_ids, ...suggestedTagIds])],
        }));
      }
    } catch (error) {
      console.error("Error extracting from text:", error);
      setFormErrors({
        api: "Wystąpił błąd sieci. Sprawdź połączenie internetowe i spróbuj ponownie.",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleReprocessText = async () => {
    setShowReprocessDialog(false);
    setFormData((prev) => ({
      ...prev,
      rawTextToProcess: prev.originalRawText,
    }));
    await handleExtractFromText();
  };

  const handleFeedbackSubmit = async (feedback: FeedbackType) => {
    if (!formData.extractionLogId) return;

    try {
      const response = await fetch(`/api/recipe/extraction/${formData.extractionLogId}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          feedback: feedback,
        }),
      });

      if (!response.ok) {
        console.error("Error submitting feedback:", response.status, response.statusText);
        // Even if feedback fails, we can update the UI state
      }

      setFormData((prev) => ({
        ...prev,
        aiFeedback: feedback,
      }));
    } catch (error) {
      console.error("Error submitting feedback:", error);
      // Even if feedback fails, we can update the UI state
      setFormData((prev) => ({
        ...prev,
        aiFeedback: feedback,
      }));
    }
  };

  const toggleOriginalTextVisibility = () => {
    setFormData((prev) => ({
      ...prev,
      isOriginalTextVisible: !prev.isOriginalTextVisible,
    }));
  };

  const handleExtractFromUrl = async () => {
    if (!formData.urlToImport?.trim()) {
      setFormErrors({ urlToImport: "Wprowadź URL przepisu do importu" });
      return;
    }

    setIsExtracting(true);
    setFormErrors({});

    try {
      const response = await fetch("/api/recipe/extract-from-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: formData.urlToImport,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (response.status === 400) {
          setFormErrors({
            urlToImport: errorData.error?.message || "Nieprawidłowy URL",
          });
        } else if (response.status === 403) {
          setFormErrors({
            api:
              errorData.error?.message ||
              "Strona blokuje automatyczne pobieranie treści. Spróbuj skopiować tekst przepisu i użyć opcji 'Importuj z tekstu'.",
          });
        } else if (response.status === 422) {
          setFormErrors({
            api: "Nie udało się pobrać przepisu z podanego URL. Sprawdź czy adres jest poprawny i spróbuj ponownie.",
          });
        } else if (response.status === 429) {
          setFormErrors({
            api: "Przekroczono dzienny limit ekstrakcji (100/dzień). Spróbuj ponownie jutro.",
          });
        } else {
          setFormErrors({
            api: errorData.error?.message || "Wystąpił błąd podczas importu z URL.",
          });
        }
        return;
      }

      const extractionResponse: ExtractFromUrlResponseDTO = await response.json();

      // Wypełnianie formularza danymi z ekstrakcji
      setFormData((prev) => ({
        ...prev,
        name: extractionResponse.extracted_data.name,
        ingredients: extractionResponse.extracted_data.ingredients,
        steps: extractionResponse.extracted_data.steps,
        preparation_time: extractionResponse.extracted_data.preparation_time || "",
        source_type: "url" as RecipeSourceType,
        source_url: extractionResponse.extracted_data.source_url || formData.urlToImport,
        image_url: extractionResponse.extracted_data.image_url || "",
        extractionLogId: extractionResponse.extraction_log_id,
        aiFeedback: null,
      }));

      // Ustaw sugerowane tagi
      const suggestedTagIds = availableTags
        .filter((tag) => extractionResponse.extracted_data.suggested_tags?.includes(tag.slug))
        .map((tag) => tag.id);

      if (suggestedTagIds.length > 0) {
        setFormData((prev) => ({
          ...prev,
          tag_ids: [...new Set([...prev.tag_ids, ...suggestedTagIds])],
        }));
      }
    } catch (error) {
      console.error("Error extracting from URL:", error);
      setFormErrors({
        api: "Wystąpił błąd sieci. Sprawdź połączenie internetowe i spróbuj ponownie.",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormErrors({});

    try {
      // Walidacja za pomocą Zod
      const validatedData = recipeSchema.parse(formData);

      // Przygotowanie danych dla API
      const recipeData: CreateRecipeCommand | UpdateRecipeCommand = {
        name: validatedData.name,
        ingredients: validatedData.ingredients,
        steps: validatedData.steps,
        preparation_time: validatedData.preparation_time || null,
        source_type: validatedData.source_type,
        source_url: validatedData.source_url || null,
        image_url: validatedData.image_url || null,
        notes: validatedData.notes || null,
        tag_ids: validatedData.tag_ids,
      };

      let response: Response;
      if (mode === "new") {
        // Tworzenie nowego przepisu
        response = await fetch("/api/recipes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(recipeData),
        });
      } else {
        // Aktualizacja istniejącego przepisu
        if (!recipeId) {
          throw new Error("Brak ID przepisu do aktualizacji");
        }
        response = await fetch(`/api/recipes/${recipeId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(recipeData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();

        if (response.status === 400) {
          const details = errorData.error?.details;
          if (details) {
            // Mapowanie błędów walidacji z API do formularza
            const mappedErrors: Record<string, string> = {};
            Object.entries(details).forEach(([field, errors]) => {
              if (Array.isArray(errors) && errors.length > 0) {
                mappedErrors[field] = errors[0];
              }
            });
            setFormErrors(mappedErrors);
          } else {
            setFormErrors({
              api: errorData.error?.message || "Błąd walidacji danych.",
            });
          }
        } else if (response.status === 404) {
          setFormErrors({
            api: "Przepis nie został znaleziony.",
          });
        } else {
          setFormErrors({
            api: errorData.error?.message || "Wystąpił błąd podczas zapisywania przepisu.",
          });
        }
        return;
      }

      // Sukces - pobierz dane utworzonego/zaktualizowanego przepisu
      const savedRecipe: RecipeDetailDTO = await response.json();

      // Przekierowanie na stronę szczegółów przepisu
      window.location.href = `/recipes/${savedRecipe.id}`;
    } catch (error) {
      console.error("Error submitting form:", error);

      if (error instanceof z.ZodError) {
        // Konwertujemy błędy Zod na format formularza
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const path = err.path.join(".");
          errors[path] = err.message;
        });
        setFormErrors(errors);

        // Przewiń do pierwszego błędu
        const firstErrorField = document.querySelector(".text-red-500");
        if (firstErrorField) {
          firstErrorField.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      } else {
        setFormErrors({
          api: "Wystąpił błąd sieci. Sprawdź połączenie internetowe i spróbuj ponownie.",
        });
        // Przewiń do komunikatu o błędzie API
        const apiError = document.querySelector("[data-error='api']");
        if (apiError) {
          apiError.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // TODO: Implement DynamicFieldList for ingredients and steps
  // TODO: Implement MultiSelectTags for tags
  // TODO: Implement AI mode tabs/sections (Paste Text, Import URL)
  // TODO: Implement AI feedback buttons
  // TODO: Implement image display (non-editable for MVP)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Mode selection (Tabs) */}
      <Tabs
        defaultValue="url"
        value={currentMode}
        onValueChange={(value) => setCurrentMode(value as "manual" | "text" | "url")}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="url">Importuj z URL</TabsTrigger>
          <TabsTrigger value="text">Wklej tekst</TabsTrigger>
          <TabsTrigger value="manual">Manualne dodawanie</TabsTrigger>
        </TabsList>

        {/* Manual Mode Tab */}
        <TabsContent value="manual" className="space-y-6 mt-6">
          <div>
            <Label htmlFor="name">Nazwa potrawy</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              maxLength={255}
              className={cn("mt-1", formErrors.name && "border-red-500")}
            />
            {formErrors.name && <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>}
          </div>

          {/* DynamicFieldList for ingredients */}
          <div>
            <DynamicFieldList
              items={formData.ingredients}
              setItems={(newItems: string[]) => setFormData((prev) => ({ ...prev, ingredients: newItems }))}
              label="Składniki"
              fieldPlaceholder="Wpisz składnik"
              addButtonLabel="Dodaj składnik"
              minItems={1}
              maxItems={50}
              maxCharsPerItem={200}
              fieldType="input"
              error={formErrors.ingredients}
            />
          </div>

          {/* DynamicFieldList for steps */}
          <div>
            <DynamicFieldList
              items={formData.steps}
              setItems={(newItems: string[]) => setFormData((prev) => ({ ...prev, steps: newItems }))}
              label="Kroki przygotowania"
              fieldPlaceholder="Opisz krok przygotowania"
              addButtonLabel="Dodaj krok"
              minItems={1}
              maxItems={50}
              maxCharsPerItem={2000}
              fieldType="textarea"
              textareaRows={3}
              fieldLabel={(index: number) => `Krok ${index + 1}`}
              error={formErrors.steps}
            />
          </div>

          <div>
            <Label htmlFor="preparation_time">Czas przygotowania</Label>
            <Input
              id="preparation_time"
              name="preparation_time"
              value={formData.preparation_time}
              onChange={handleInputChange}
              maxLength={100}
              className={cn("mt-1", formErrors.preparation_time && "border-red-500")}
            />
            {formErrors.preparation_time && <p className="text-sm text-red-500 mt-1">{formErrors.preparation_time}</p>}
          </div>

          {/* Source URL and Image URL might be conditionally displayed based on source_type or AI processing */}
          {(formData.source_type === "url" || formData.image_url) && (
            <div>
              {formData.source_url && (
                <div className="mb-4">
                  <Label htmlFor="source_url">Źródło (URL)</Label>
                  <Input
                    id="source_url"
                    name="source_url"
                    value={formData.source_url}
                    onChange={handleInputChange}
                    readOnly={
                      formData.source_type !== "url" || (formData.source_type === "url" && !!formData.extractionLogId)
                    } // Readonly if not URL type or if already extracted from URL
                    className={cn("mt-1 bg-gray-50", formErrors.source_url && "border-red-500")}
                  />
                  {formErrors.source_url && <p className="text-sm text-red-500 mt-1">{formErrors.source_url}</p>}
                </div>
              )}
              {formData.image_url && (
                <div>
                  <Label>Obrazek</Label>
                  <img
                    src={formData.image_url}
                    alt="Podgląd obrazka przepisu"
                    className="mt-1 border rounded-md max-h-60 object-contain"
                  />
                </div>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="notes">Notatki</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={4}
              maxLength={5000}
              className={cn("mt-1", formErrors.notes && "border-red-500")}
            />
            {formErrors.notes && <p className="text-sm text-red-500 mt-1">{formErrors.notes}</p>}
          </div>

          {/* MultiSelectTags */}
          <div>
            <Label>Tagi</Label>
            <MultiSelectTags
              availableTags={availableTags}
              selectedTagIds={formData.tag_ids}
              setSelectedTagIds={(ids) => setFormData((prev) => ({ ...prev, tag_ids: ids }))}
              maxTags={10}
            />
            {formErrors.tag_ids && <p className="text-sm text-red-500 mt-1">{formErrors.tag_ids}</p>}
          </div>
        </TabsContent>

        {/* Text Mode Tab */}
        <TabsContent value="text" className="space-y-6 mt-6">
          <div>
            <Label htmlFor="rawTextToProcess">Wklej tekst przepisu</Label>
            <Textarea
              id="rawTextToProcess"
              name="rawTextToProcess"
              value={formData.rawTextToProcess || ""}
              onChange={handleInputChange}
              rows={8}
              maxLength={10000}
              placeholder="Wklej tutaj tekst przepisu, który chcesz przetworzyć..."
              className={cn("mt-1", formErrors.rawTextToProcess && "border-red-500")}
            />
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>
                {formErrors.rawTextToProcess && <span className="text-red-500">{formErrors.rawTextToProcess}</span>}
              </span>
              <span>{(formData.rawTextToProcess || "").length}/10000</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleExtractFromText}
              disabled={isExtracting || !formData.rawTextToProcess?.trim()}
              className="flex items-center gap-2"
            >
              {isExtracting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Przetwarzanie...
                </>
              ) : (
                "Przetwórz tekst"
              )}
            </Button>

            {formData.originalRawText && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={toggleOriginalTextVisibility}
                  className="flex items-center gap-2"
                >
                  {formData.isOriginalTextVisible ? (
                    <>
                      <EyeOff className="h-4 w-4" />
                      Ukryj oryginalny tekst
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      Pokaż oryginalny tekst
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowReprocessDialog(true)}
                  disabled={isExtracting}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Przetwórz ponownie
                </Button>
              </>
            )}
          </div>

          {formData.isOriginalTextVisible && formData.originalRawText && (
            <div>
              <Label htmlFor="originalRawText">Oryginalny tekst</Label>
              <Textarea
                id="originalRawText"
                value={formData.originalRawText}
                onChange={(e) => setFormData((prev) => ({ ...prev, originalRawText: e.target.value }))}
                rows={6}
                className="mt-1 bg-gray-50"
              />
            </div>
          )}

          {formData.extractionLogId && (
            <AiFeedbackButtons
              extractionLogId={formData.extractionLogId}
              currentFeedback={formData.aiFeedback}
              onFeedbackSubmit={handleFeedbackSubmit}
              className="mt-4"
            />
          )}

          {/* Show extracted data in manual form fields */}
          {formData.extractionLogId && (
            <div className="space-y-6 border-t pt-6">
              <h3 className="text-lg font-medium">Przetworzone dane</h3>

              <div>
                <Label htmlFor="name">Nazwa potrawy</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  maxLength={255}
                  className={cn("mt-1", formErrors.name && "border-red-500")}
                />
                {formErrors.name && <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>}
              </div>

              <div>
                <DynamicFieldList
                  items={formData.ingredients}
                  setItems={(newItems: string[]) => setFormData((prev) => ({ ...prev, ingredients: newItems }))}
                  label="Składniki"
                  fieldPlaceholder="Wpisz składnik"
                  addButtonLabel="Dodaj składnik"
                  minItems={1}
                  maxItems={50}
                  maxCharsPerItem={200}
                  fieldType="input"
                  error={formErrors.ingredients}
                />
              </div>

              <div>
                <DynamicFieldList
                  items={formData.steps}
                  setItems={(newItems: string[]) => setFormData((prev) => ({ ...prev, steps: newItems }))}
                  label="Kroki przygotowania"
                  fieldPlaceholder="Opisz krok przygotowania"
                  addButtonLabel="Dodaj krok"
                  minItems={1}
                  maxItems={50}
                  maxCharsPerItem={2000}
                  fieldType="textarea"
                  textareaRows={3}
                  fieldLabel={(index: number) => `Krok ${index + 1}`}
                  error={formErrors.steps}
                />
              </div>

              <div>
                <Label htmlFor="preparation_time">Czas przygotowania</Label>
                <Input
                  id="preparation_time"
                  name="preparation_time"
                  value={formData.preparation_time}
                  onChange={handleInputChange}
                  maxLength={100}
                  className={cn("mt-1", formErrors.preparation_time && "border-red-500")}
                />
                {formErrors.preparation_time && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.preparation_time}</p>
                )}
              </div>

              <div>
                <Label htmlFor="notes">Notatki</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={4}
                  maxLength={5000}
                  className={cn("mt-1", formErrors.notes && "border-red-500")}
                />
                {formErrors.notes && <p className="text-sm text-red-500 mt-1">{formErrors.notes}</p>}
              </div>

              <div>
                <Label>Tagi</Label>
                <MultiSelectTags
                  availableTags={availableTags}
                  selectedTagIds={formData.tag_ids}
                  setSelectedTagIds={(ids) => setFormData((prev) => ({ ...prev, tag_ids: ids }))}
                  maxTags={10}
                />
                {formErrors.tag_ids && <p className="text-sm text-red-500 mt-1">{formErrors.tag_ids}</p>}
              </div>
            </div>
          )}
        </TabsContent>

        {/* URL Mode Tab */}
        <TabsContent value="url" className="space-y-6 mt-6">
          <div>
            <Label htmlFor="urlToImport">URL przepisu</Label>
            <Input
              id="urlToImport"
              name="urlToImport"
              type="url"
              value={formData.urlToImport || ""}
              onChange={handleInputChange}
              placeholder="https://aniagotuje.pl/przepis/nazwa-przepisu"
              className={cn("mt-1", formErrors.urlToImport && "border-red-500")}
            />
            {formErrors.urlToImport && <p className="text-sm text-red-500 mt-1">{formErrors.urlToImport}</p>}
            <p className="text-sm text-gray-500 mt-1">Obsługiwane domeny: aniagotuje.pl, kwestiasmaku.com</p>
          </div>

          <div>
            <Button
              type="button"
              onClick={handleExtractFromUrl}
              disabled={isExtracting || !formData.urlToImport?.trim()}
              className="flex items-center gap-2"
            >
              {isExtracting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Importowanie...
                </>
              ) : (
                "Importuj z URL"
              )}
            </Button>
          </div>

          {formData.extractionLogId && (
            <AiFeedbackButtons
              extractionLogId={formData.extractionLogId}
              currentFeedback={formData.aiFeedback}
              onFeedbackSubmit={handleFeedbackSubmit}
              className="mt-4"
            />
          )}

          {/* Show extracted data in manual form fields */}
          {formData.extractionLogId && (
            <div className="space-y-6 border-t pt-6">
              <h3 className="text-lg font-medium">Zaimportowane dane</h3>

              <div>
                <Label htmlFor="name">Nazwa potrawy</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  maxLength={255}
                  className={cn("mt-1", formErrors.name && "border-red-500")}
                />
                {formErrors.name && <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>}
              </div>

              <div>
                <DynamicFieldList
                  items={formData.ingredients}
                  setItems={(newItems: string[]) => setFormData((prev) => ({ ...prev, ingredients: newItems }))}
                  label="Składniki"
                  fieldPlaceholder="Wpisz składnik"
                  addButtonLabel="Dodaj składnik"
                  minItems={1}
                  maxItems={50}
                  maxCharsPerItem={200}
                  fieldType="input"
                  error={formErrors.ingredients}
                />
              </div>

              <div>
                <DynamicFieldList
                  items={formData.steps}
                  setItems={(newItems: string[]) => setFormData((prev) => ({ ...prev, steps: newItems }))}
                  label="Kroki przygotowania"
                  fieldPlaceholder="Opisz krok przygotowania"
                  addButtonLabel="Dodaj krok"
                  minItems={1}
                  maxItems={50}
                  maxCharsPerItem={2000}
                  fieldType="textarea"
                  textareaRows={3}
                  fieldLabel={(index: number) => `Krok ${index + 1}`}
                  error={formErrors.steps}
                />
              </div>

              <div>
                <Label htmlFor="preparation_time">Czas przygotowania</Label>
                <Input
                  id="preparation_time"
                  name="preparation_time"
                  value={formData.preparation_time}
                  onChange={handleInputChange}
                  maxLength={100}
                  className={cn("mt-1", formErrors.preparation_time && "border-red-500")}
                />
                {formErrors.preparation_time && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.preparation_time}</p>
                )}
              </div>

              {formData.source_url && (
                <div>
                  <Label htmlFor="source_url">Źródło (URL)</Label>
                  <Input
                    id="source_url"
                    name="source_url"
                    value={formData.source_url}
                    onChange={handleInputChange}
                    readOnly
                    className="mt-1 bg-gray-50"
                  />
                </div>
              )}

              {formData.image_url && (
                <div>
                  <Label>Obrazek</Label>
                  <img
                    src={formData.image_url}
                    alt="Podgląd obrazka przepisu"
                    className="mt-1 border rounded-md max-h-60 object-contain"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="notes">Notatki</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={4}
                  maxLength={5000}
                  className={cn("mt-1", formErrors.notes && "border-red-500")}
                />
                {formErrors.notes && <p className="text-sm text-red-500 mt-1">{formErrors.notes}</p>}
              </div>

              <div>
                <Label>Tagi</Label>
                <MultiSelectTags
                  availableTags={availableTags}
                  selectedTagIds={formData.tag_ids}
                  setSelectedTagIds={(ids) => setFormData((prev) => ({ ...prev, tag_ids: ids }))}
                  maxTags={10}
                />
                {formErrors.tag_ids && <p className="text-sm text-red-500 mt-1">{formErrors.tag_ids}</p>}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {formErrors.api && (
        <div data-error="api" className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{formErrors.api}</p>
        </div>
      )}

      <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
        {isLoading ? "Zapisywanie..." : mode === "edit" ? "Zapisz zmiany" : "Zapisz przepis"}
      </Button>

      {/* Dialog for reprocessing confirmation */}
      <Dialog open={showReprocessDialog} onOpenChange={setShowReprocessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Potwierdzenie ponownego przetwarzania
            </DialogTitle>
            <DialogDescription>
              Ponowne przetworzenie tekstu spowoduje nadpisanie aktualnie wprowadzonych danych w formularzu. Czy na
              pewno chcesz kontynuować?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReprocessDialog(false)}>
              Anuluj
            </Button>
            <Button onClick={handleReprocessText} className="bg-amber-600 hover:bg-amber-700">
              Tak, przetwórz ponownie
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
};

export default RecipeForm;

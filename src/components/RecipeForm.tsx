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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  recipeData?: RecipeDetailDTO | null;
  recipeId?: string;
  mode: "new" | "edit";
}

// Helper component for rendering the main form fields
const RecipeFormFields = ({
  formData,
  formErrors,
  handleInputChange,
  setFormData,
  availableTags,
}: {
  formData: RecipeFormData;
  formErrors: Record<string, string>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  setFormData: React.Dispatch<React.SetStateAction<RecipeFormData>>;
  availableTags: TagDTO[];
}) => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Podstawowe informacje</CardTitle>
        <CardDescription>Podaj nazwę, czas przygotowania i otaguj swój przepis.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Obrazek przepisu - przeniesiony wyżej */}
        {formData.image_url && (
          <div className="text-center">
            <Label>Obrazek przepisu</Label>
            <div className="mt-2 border rounded-xl overflow-hidden bg-muted/20">
              <img src={formData.image_url} alt="Podgląd obrazka przepisu" className="w-full max-h-64 object-cover" />
            </div>
          </div>
        )}
        <Label>Nazwa potrawy</Label>
        <Input
          id="name"
          name="name"
          placeholder="Nazwa potrawy"
          value={formData.name}
          onChange={handleInputChange}
          maxLength={255}
          className={cn("mt-1", formErrors.name && "border-destructive")}
          data-testid="recipe-name-input"
        />
        {formErrors.name && (
          <p className="text-sm text-destructive mt-1" data-testid="recipe-name-error">
            {formErrors.name}
          </p>
        )}
        <Label>Czas przygotowania</Label>
        <Input
          id="preparation_time"
          name="preparation_time"
          placeholder="Czas przygotowania"
          value={formData.preparation_time || ""}
          onChange={handleInputChange}
          className={cn("mt-1", formErrors.preparation_time && "border-destructive")}
          data-testid="preparation-time-input"
        />

        <div className="mt-4">
          <Label>Tagi</Label>
          <MultiSelectTags
            availableTags={availableTags}
            selectedTagIds={formData.tag_ids}
            setSelectedTagIds={(ids) => setFormData((prev) => ({ ...prev, tag_ids: ids }))}
            maxTags={10}
            data-testid="tags-multi-select"
          />
          {formErrors.tag_ids && <p className="text-sm text-destructive mt-1">{formErrors.tag_ids}</p>}
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Składniki</CardTitle>
        <CardDescription>Wylistuj wszystkie potrzebne składniki, każdy w osobnym polu.</CardDescription>
      </CardHeader>
      <CardContent>
        <DynamicFieldList
          items={formData.ingredients}
          setItems={(newItems: string[]) => setFormData((prev) => ({ ...prev, ingredients: newItems }))}
          label="Składniki"
          fieldPlaceholder="np. 1 szklanka mąki"
          addButtonLabel="Dodaj składnik"
          minItems={1}
          maxItems={50}
          maxCharsPerItem={200}
          fieldType="input"
          error={formErrors.ingredients}
          data-testid="ingredients-dynamic-list"
        />
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Kroki przygotowania</CardTitle>
        <CardDescription>Opisz kolejne etapy przygotowania potrawy.</CardDescription>
      </CardHeader>
      <CardContent>
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
          data-testid="steps-dynamic-list"
        />
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Dodatkowe informacje</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {formData.source_url && (
          <div>
            <Label htmlFor="source_url">Źródło (URL)</Label>
            <Input
              id="source_url"
              name="source_url"
              value={formData.source_url}
              onChange={handleInputChange}
              readOnly
              className={cn("mt-1 bg-muted", formErrors.source_url && "border-destructive")}
            />
            {formErrors.source_url && <p className="text-sm text-destructive mt-1">{formErrors.source_url}</p>}
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
            className={cn("mt-1", formErrors.notes && "border-destructive")}
            data-testid="notes-textarea"
          />
          {formErrors.notes && <p className="text-sm text-destructive mt-1">{formErrors.notes}</p>}
        </div>
      </CardContent>
    </Card>
  </div>
);

const RecipeForm: React.FC<RecipeFormProps> = ({ recipeData, mode, recipeId }) => {
  const initialFormData: RecipeFormData = {
    id: recipeData?.id || undefined,
    name: recipeData?.name || "",
    ingredients: recipeData?.ingredients || [""],
    steps: recipeData?.steps || [""],
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
    const loadTags = async () => {
      const tags = await fetchTags();
      setAvailableTags(tags);
    };
    loadTags();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => {
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: formData.rawTextToProcess }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) {
          setFormErrors({ api: "Przekroczono dzienny limit ekstrakcji (100/dzień). Spróbuj ponownie jutro." });
        } else {
          setFormErrors({ api: errorData.error?.message || "Wystąpił błąd podczas przetwarzania tekstu." });
        }
        return;
      }
      const extractionResponse: ExtractFromTextResponseDTO = await response.json();
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
      const suggestedTagIds = availableTags
        .filter((tag) => extractionResponse.extracted_data.suggested_tags?.includes(tag.slug))
        .map((tag) => tag.id);
      if (suggestedTagIds.length > 0) {
        setFormData((prev) => ({ ...prev, tag_ids: [...new Set([...prev.tag_ids, ...suggestedTagIds])] }));
      }
    } catch (error) {
      console.error("Error extracting from text:", error);
      setFormErrors({ api: "Wystąpił błąd sieci. Sprawdź połączenie internetowe i spróbuj ponownie." });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleReprocessText = async () => {
    setShowReprocessDialog(false);
    setFormData((prev) => ({ ...prev, rawTextToProcess: prev.originalRawText }));
    await handleExtractFromText();
  };

  const handleFeedbackSubmit = async (feedback: FeedbackType) => {
    if (!formData.extractionLogId) return;
    try {
      await fetch(`/api/recipe/extraction/${formData.extractionLogId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback }),
      });
    } catch (error) {
      console.error("Error submitting feedback:", error);
    } finally {
      setFormData((prev) => ({ ...prev, aiFeedback: feedback }));
    }
  };

  const toggleOriginalTextVisibility = () => {
    setFormData((prev) => ({ ...prev, isOriginalTextVisible: !prev.isOriginalTextVisible }));
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: formData.urlToImport }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) {
          setFormErrors({ api: "Przekroczono dzienny limit ekstrakcji (100/dzień). Spróbuj ponownie jutro." });
        } else {
          setFormErrors({ api: errorData.error?.message || "Wystąpił błąd podczas importu z URL." });
        }
        return;
      }
      const extractionResponse: ExtractFromUrlResponseDTO = await response.json();
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
      const suggestedTagIds = availableTags
        .filter((tag) => extractionResponse.extracted_data.suggested_tags?.includes(tag.slug))
        .map((tag) => tag.id);
      if (suggestedTagIds.length > 0) {
        setFormData((prev) => ({ ...prev, tag_ids: [...new Set([...prev.tag_ids, ...suggestedTagIds])] }));
      }
    } catch (error) {
      console.error("Error extracting from URL:", error);
      setFormErrors({ api: "Wystąpił błąd sieci. Sprawdź połączenie internetowe i spróbuj ponownie." });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormErrors({});
    try {
      const validatedData = recipeSchema.parse(formData);
      const recipeApiData: CreateRecipeCommand | UpdateRecipeCommand = {
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
        response = await fetch("/api/recipes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(recipeApiData),
        });
      } else {
        if (!recipeId) throw new Error("Brak ID przepisu do aktualizacji");
        response = await fetch(`/api/recipes/${recipeId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(recipeApiData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        setFormErrors({ api: errorData.error?.message || "Wystąpił błąd podczas zapisywania przepisu." });
        return;
      }

      const savedRecipe: RecipeDetailDTO = await response.json();
      // Store success message in session storage to show after redirect
      sessionStorage.setItem(
        "toastMessage",
        mode === "edit" ? "Zmiany w przepisie zostały zapisane." : "Nowy przepis został pomyślnie utworzony."
      );
      window.location.href = `/recipes/${savedRecipe.id}`;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          errors[err.path.join(".")] = err.message;
        });
        setFormErrors(errors);
      } else {
        setFormErrors({ api: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie." });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8" data-testid="recipe-form">
      <Tabs
        defaultValue="url"
        value={currentMode}
        onValueChange={(value) => setCurrentMode(value as "manual" | "text" | "url")}
        data-testid="recipe-form-tabs"
      >
        <TabsList className="grid w-[600px] mx-auto grid-cols-3" data-testid="recipe-form-tabs-list">
          <TabsTrigger value="url" className="font-medium" data-testid="tab-trigger-url">
            Importuj z URL
          </TabsTrigger>
          <TabsTrigger value="text" className="font-medium" data-testid="tab-trigger-text">
            Wklej tekst
          </TabsTrigger>
          <TabsTrigger value="manual" className="font-medium" data-testid="tab-trigger-manual">
            Dodaj manualnie
          </TabsTrigger>
        </TabsList>

        <TabsContent value="url" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Importuj przepis z linku</CardTitle>
              <CardDescription>
                Wklej link do strony z przepisem, a my spróbujemy go automatycznie zaimportować.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="urlToImport">URL przepisu</Label>
                <Input
                  id="urlToImport"
                  name="urlToImport"
                  type="url"
                  value={formData.urlToImport || ""}
                  onChange={handleInputChange}
                  placeholder="https://kwestiasmaku.com/..."
                  className={cn("mt-1", formErrors.urlToImport && "border-destructive")}
                />
                {formErrors.urlToImport && <p className="text-sm text-destructive mt-1">{formErrors.urlToImport}</p>}
                <p className="text-sm text-muted-foreground mt-1">
                  Obsługiwane domeny: aniagotuje.pl, kwestiasmaku.com
                </p>
              </div>
              <Button
                type="button"
                onClick={handleExtractFromUrl}
                disabled={isExtracting || !formData.urlToImport?.trim()}
                className="flex items-center gap-2"
              >
                {isExtracting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Importowanie...
                  </>
                ) : (
                  "Importuj z URL"
                )}
              </Button>
            </CardContent>
          </Card>

          {formData.extractionLogId && (
            <div className="space-y-6 border-t pt-6">
              <h3 className="text-lg font-medium">Zaimportowane dane</h3>
              <AiFeedbackButtons
                extractionLogId={formData.extractionLogId}
                currentFeedback={formData.aiFeedback}
                onFeedbackSubmit={handleFeedbackSubmit}
              />
              <RecipeFormFields {...{ formData, formErrors, handleInputChange, setFormData, availableTags }} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="text" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Importuj przepis z tekstu</CardTitle>
              <CardDescription>
                Wklej skopiowany tekst przepisu, a my spróbujemy go automatycznie przetworzyć.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="rawTextToProcess">Wklej tekst przepisu</Label>
                <Textarea
                  id="rawTextToProcess"
                  name="rawTextToProcess"
                  value={formData.rawTextToProcess || ""}
                  onChange={handleInputChange}
                  rows={8}
                  maxLength={10000}
                  placeholder="Wklej tutaj tekst przepisu..."
                  className={cn("mt-1", formErrors.rawTextToProcess && "border-destructive")}
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <span>
                    {formErrors.rawTextToProcess && (
                      <span className="text-destructive">{formErrors.rawTextToProcess}</span>
                    )}
                  </span>
                  <span>{(formData.rawTextToProcess || "").length}/10000</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={handleExtractFromText}
                  disabled={isExtracting || !formData.rawTextToProcess?.trim()}
                  className="flex items-center gap-2"
                >
                  {isExtracting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" /> Przetwarzanie...
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
                          <EyeOff className="h-4 w-4" /> Ukryj oryginał
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4" /> Pokaż oryginał
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
                      <RefreshCw className="h-4 w-4" /> Przetwórz ponownie
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {formData.isOriginalTextVisible && formData.originalRawText && (
            <Card>
              <CardHeader>
                <CardTitle>Oryginalny tekst</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="originalRawText"
                  value={formData.originalRawText}
                  readOnly
                  rows={8}
                  className="mt-1 bg-muted"
                />
              </CardContent>
            </Card>
          )}

          {formData.extractionLogId && (
            <div className="space-y-6 border-t pt-6">
              <h3 className="text-lg font-medium">Przetworzone dane</h3>
              <AiFeedbackButtons
                extractionLogId={formData.extractionLogId}
                currentFeedback={formData.aiFeedback}
                onFeedbackSubmit={handleFeedbackSubmit}
              />
              <RecipeFormFields {...{ formData, formErrors, handleInputChange, setFormData, availableTags }} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="manual" className="mt-6">
          <RecipeFormFields {...{ formData, formErrors, handleInputChange, setFormData, availableTags }} />
        </TabsContent>
      </Tabs>

      {formErrors.api && (
        <div data-error="api" className="rounded-md bg-destructive/10 p-4 border border-destructive/20">
          <p className="text-sm font-medium text-destructive">{formErrors.api}</p>
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading} size="lg" className="w-full sm:w-auto" data-testid="submit-button">
          {isLoading ? "Zapisywanie..." : mode === "edit" ? "Zapisz zmiany" : "Zapisz przepis"}
        </Button>
      </div>

      <Dialog open={showReprocessDialog} onOpenChange={setShowReprocessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Potwierdzenie
            </DialogTitle>
            <DialogDescription>
              Ponowne przetworzenie tekstu nadpisze wprowadzone zmiany. Czy na pewno chcesz kontynuować?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReprocessDialog(false)}>
              Anuluj
            </Button>
            <Button onClick={handleReprocessText}>Tak, przetwórz ponownie</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
};

export default RecipeForm;

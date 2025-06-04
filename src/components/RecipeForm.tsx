import React, { useState, useEffect } from "react";
import { z } from "zod";
import type { RecipeDetailDTO, RecipeSourceType, TagDTO } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import DynamicFieldList from "@/components/DynamicFieldList";
import MultiSelectTags from "@/components/MultiSelectTags";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Placeholder for later

// Mocked tags data for development
const MOCK_TAGS: TagDTO[] = [
  { id: "1", name: "Śniadanie", slug: "sniadanie" },
  { id: "2", name: "Obiad", slug: "obiad" },
  { id: "3", name: "Kolacja", slug: "kolacja" },
  { id: "4", name: "Wegetariańskie", slug: "wegetarianskie" },
  { id: "5", name: "Wegańskie", slug: "weganskie" },
  { id: "6", name: "Deser", slug: "deser" },
  { id: "7", name: "Przekąska", slug: "przekaska" },
  { id: "8", name: "Zupa", slug: "zupa" },
  { id: "9", name: "Sałatka", slug: "salatka" },
  { id: "10", name: "Szybkie", slug: "szybkie" },
];

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
  // source_url: z
  //   .string()
  //   .url("Nieprawidłowy format URL")
  //   .refine((url) => {
  //     if (!url) return true;
  //     try {
  //       const parsedUrl = new URL(url);
  //       return ["aniagotuje.pl", "kwestiasmaku.com"].some((domain) => parsedUrl.hostname.endsWith(domain));
  //     } catch {
  //       return false;
  //     }
  //   }, "URL musi pochodzić z dozwolonych domen (aniagotuje.pl lub kwestiasmaku.com)")
  //   .optional(),
  // image_url: z.string().url("Nieprawidłowy format URL obrazka").optional(),
  notes: z.string().max(5000, "Notatki nie mogą przekraczać 5000 znaków").optional(),
  tag_ids: z.array(z.string()).max(10, "Możesz wybrać maksymalnie 10 tagów"),
  rawTextToProcess: z.string().max(10000, "Tekst nie może przekraczać 10000 znaków").optional(),
  originalRawText: z.string().optional(),
  isOriginalTextVisible: z.boolean(),
  // urlToImport: z.string().url("Nieprawidłowy format URL").optional(),
  extractionLogId: z.string().nullable(),
  aiFeedback: z.any().nullable(),
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
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [availableTags] = useState<TagDTO[]>(MOCK_TAGS);

  useEffect(() => {
    console.log("RecipeForm mounted, mode:", mode, "recipeId:", recipeId);
    if (mode === "edit" && recipeData) {
      console.log("Populating form with recipeData:", recipeData);
    }
  }, [mode, recipeData, recipeId]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormErrors({});

    try {
      // Walidacja za pomocą Zod
      const validatedData = recipeSchema.parse(formData);
      console.log("Form data valid:", validatedData);

      // Symulacja wywołania API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // if (Math.random() > 0.5) {
      //   console.log("Simulated success");
      //   // TODO: Redirect to recipe detail page
      // } else {
      //   throw new Error("Simulated API error");
      // }
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
          api: "Wystąpił błąd podczas zapisywania przepisu. Spróbuj ponownie później.",
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
      {/* Mode selection (Tabs - to be implemented later) */}
      {/* <Tabs defaultValue="manual" onValueChange={(value) => setCurrentFormMode(value as 'manual' | 'text' | 'url')}>
        <TabsList>
          <TabsTrigger value="manual">Manual</TabsTrigger>
          <TabsTrigger value="text">Wklej tekst</TabsTrigger>
          <TabsTrigger value="url">Importuj z URL</TabsTrigger>
        </TabsList>
        <TabsContent value="manual">*/}
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
      {/*</TabsContent>
        <TabsContent value="text">
          <p>Tryb wklejania tekstu (do zaimplementowania)</p>
        </TabsContent>
        <TabsContent value="url">
          <p>Tryb importu z URL (do zaimplementowania)</p>
        </TabsContent>
      </Tabs>*/}

      {formErrors.api && (
        <div data-error="api" className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{formErrors.api}</p>
        </div>
      )}

      <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
        {isLoading ? "Zapisywanie..." : mode === "edit" ? "Zapisz zmiany" : "Zapisz przepis"}
      </Button>
    </form>
  );
};

export default RecipeForm;

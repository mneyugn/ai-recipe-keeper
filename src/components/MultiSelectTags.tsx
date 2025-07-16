import React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import type { TagDTO } from "@/types";

// Predefiniowane kolory dla tagów - zgodne z design systemem
const TAG_COLORS = [
  "bg-primary/10 text-primary hover:bg-primary/15 border-primary/20",
  "bg-accent/10 text-accent hover:bg-accent/15 border-accent/20",
  "bg-success/10 text-success hover:bg-success/15 border-success/20",
  "bg-warning/10 text-warning hover:bg-warning/15 border-warning/20",
  "bg-destructive/10 text-destructive hover:bg-destructive/15 border-destructive/20",
  "bg-secondary/50 text-secondary-foreground hover:bg-secondary/70 border-secondary/30",
  "bg-muted/70 text-muted-foreground hover:bg-muted border-muted/50",
  "bg-primary/20 text-primary hover:bg-primary/25 border-primary/30",
  "bg-accent/20 text-accent hover:bg-accent/25 border-accent/30",
  "bg-success/20 text-success hover:bg-success/25 border-success/30",
];

// Funkcja do przypisywania koloru na podstawie ID tagu
const getTagColor = (tagId: string): string => {
  // Używamy ostatniego znaku ID jako indeksu koloru
  const lastChar = tagId.slice(-1);
  const colorIndex = parseInt(lastChar, 16) % TAG_COLORS.length;
  return TAG_COLORS[colorIndex];
};

interface MultiSelectTagsProps {
  availableTags: TagDTO[];
  selectedTagIds: string[];
  setSelectedTagIds: (ids: string[]) => void;
  maxTags?: number;
  "data-testid"?: string;
}

const MultiSelectTags: React.FC<MultiSelectTagsProps> = ({
  availableTags,
  selectedTagIds,
  setSelectedTagIds,
  maxTags = 10,
  "data-testid": testId,
}) => {
  const [open, setOpen] = React.useState(false);

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      setSelectedTagIds(selectedTagIds.filter((id) => id !== tagId));
    } else if (selectedTagIds.length < maxTags) {
      setSelectedTagIds([...selectedTagIds, tagId]);
    }
  };

  const selectedTags = availableTags.filter((tag) => selectedTagIds.includes(tag.id));

  return (
    <div className="flex flex-col gap-2" data-testid={testId}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            onClick={() => setOpen(!open)}
            data-testid={`${testId}-trigger`}
          >
            <span className="truncate">
              {selectedTags.length > 0
                ? `Wybrano ${selectedTags.length} ${
                    selectedTags.length === 1 ? "tag" : selectedTags.length < 5 ? "tagi" : "tagów"
                  }`
                : "Wybierz tagi"}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" data-testid={`${testId}-popover`}>
          <Command>
            <CommandInput placeholder="Szukaj tagów..." data-testid={`${testId}-search`} />
            <CommandEmpty>Nie znaleziono tagów.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto" data-testid={`${testId}-options`}>
              {availableTags.map((tag) => (
                <CommandItem
                  key={tag.id}
                  onSelect={() => {
                    toggleTag(tag.id);
                  }}
                  className="flex items-center gap-2"
                  data-testid={`${testId}-option-${tag.slug}`}
                >
                  <div
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded border",
                      selectedTagIds.includes(tag.id)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted bg-transparent"
                    )}
                  >
                    {selectedTagIds.includes(tag.id) && <Check className="h-3 w-3" />}
                  </div>
                  <span className={cn("px-2 py-0.5 rounded-md text-sm border transition-colors", getTagColor(tag.id))}>
                    {tag.name}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2" data-testid={`${testId}-selected-tags`}>
          {selectedTags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className={cn("cursor-pointer transition-colors border", getTagColor(tag.id))}
              onClick={() => toggleTag(tag.id)}
              data-testid={`${testId}-selected-tag-${tag.slug}`}
            >
              {tag.name}
              <span className="ml-1 opacity-70">×</span>
            </Badge>
          ))}
        </div>
      )}

      {selectedTags.length >= maxTags && (
        <p className="text-xs text-muted-foreground" data-testid={`${testId}-limit-message`}>
          Osiągnięto limit {maxTags} {maxTags < 5 ? "tagów" : "tagów"}.
        </p>
      )}
    </div>
  );
};

export default MultiSelectTags;

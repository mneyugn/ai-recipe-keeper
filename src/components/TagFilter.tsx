import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import type { TagDTO } from "../types";
import { ChevronDown, Tag, X } from "lucide-react";

interface TagFilterProps {
  availableTags: TagDTO[];
  selectedTagIds: string[];
  onSelectionChange: (tagIds: string[]) => void;
  disabled?: boolean;
  isLoading?: boolean;
  hideLabel?: boolean;
}

const TagFilter: React.FC<TagFilterProps> = ({
  availableTags,
  selectedTagIds,
  onSelectionChange,
  disabled = false,
  isLoading = false,
  hideLabel = false,
}) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const selectedTags = availableTags.filter((tag) => selectedTagIds.includes(tag.id));

  const handleTagToggle = (tagId: string) => {
    const newSelection = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter((id) => id !== tagId)
      : [...selectedTagIds, tagId];

    onSelectionChange(newSelection);
  };

  const handleRemoveTag = (tagId: string) => {
    onSelectionChange(selectedTagIds.filter((id) => id !== tagId));
  };

  const clearAllTags = () => {
    onSelectionChange([]);
  };

  const filteredTags = availableTags.filter((tag) => tag.name.toLowerCase().includes(searchValue.toLowerCase()));

  return (
    <div className="flex flex-col gap-3">
      <div className={hideLabel ? "flex items-center gap-3" : "flex flex-col sm:flex-row gap-3 sm:items-center"}>
        {!hideLabel && (
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0">Filtruj po tagach:</span>
        )}

        <div className="flex items-center gap-3">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                disabled={disabled || isLoading}
                className={hideLabel ? "justify-center w-9 h-9 p-0" : "justify-between min-w-[160px]"}
                aria-label="Wybierz tagi do filtrowania"
              >
                {hideLabel ? (
                  // Mobile: Icon only with badge for selected count
                  <div className="relative">
                    <Tag className="h-4 w-4" />
                    {selectedTagIds.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                        {selectedTagIds.length > 9 ? "9+" : selectedTagIds.length}
                      </span>
                    )}
                  </div>
                ) : (
                  // Desktop: Full text version
                  <>
                    <span className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      <span>
                        {selectedTagIds.length === 0
                          ? "Wybierz tagi"
                          : `${selectedTagIds.length} ${selectedTagIds.length === 1 ? "tag" : "tagi"}`}
                      </span>
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </>
                )}
              </Button>
            </PopoverTrigger>

            <PopoverContent className="w-64 p-0" align="start">
              <Command>
                <CommandInput placeholder="Szukaj tagów..." value={searchValue} onValueChange={setSearchValue} />
                <CommandList>
                  {isLoading ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      <div className="animate-spin inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
                      Ładowanie tagów...
                    </div>
                  ) : (
                    <>
                      <CommandEmpty>Nie znaleziono tagów.</CommandEmpty>
                      <CommandGroup>
                        {filteredTags.map((tag) => (
                          <CommandItem
                            key={tag.id}
                            onSelect={() => handleTagToggle(tag.id)}
                            className="flex items-center gap-3 cursor-pointer"
                          >
                            <Checkbox
                              checked={selectedTagIds.includes(tag.id)}
                              onCheckedChange={() => handleTagToggle(tag.id)}
                            />
                            <span className="flex-1">{tag.name}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {selectedTagIds.length > 0 && !hideLabel && (
            <Button variant="ghost" size="sm" onClick={clearAllTags} className="text-xs">
              Wyczyść wszystkie
            </Button>
          )}
        </div>
      </div>

      {/* Wybrane tagi jako Badge - ukryte na mobile */}
      {selectedTags.length > 0 && !hideLabel && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="flex items-center gap-1 cursor-pointer hover:bg-secondary/80"
            >
              <span>{tag.name}</span>
              <button
                onClick={() => handleRemoveTag(tag.id)}
                className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                aria-label={`Usuń tag ${tag.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default TagFilter;

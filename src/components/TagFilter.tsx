import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import type { TagDTO } from "../types";

interface TagFilterProps {
  availableTags: TagDTO[];
  selectedTagIds: string[];
  onSelectionChange: (tagIds: string[]) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

const TagFilter: React.FC<TagFilterProps> = ({
  availableTags,
  selectedTagIds,
  onSelectionChange,
  disabled = false,
  isLoading = false,
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
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtruj po tagach:</span>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              disabled={disabled || isLoading}
              className="justify-between min-w-[160px]"
              aria-label="Wybierz tagi do filtrowania"
            >
              <span className="flex items-center gap-2">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 15 15"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                >
                  <path
                    d="m10.065 1.39985c-0.1663 0-0.3299 0.06588-0.4493 0.18324l-7.28168 7.28174c-0.05575 0.0558-0.10041 0.1219-0.13074 0.1941l-1.39935 3.325c-0.09446 0.2244 0.00779 0.4851 0.23083 0.5892 0.06169 0.0289 0.12705 0.0433 0.19246 0.0433 0.16984 0 0.33464-0.0918 0.41895-0.2486l1.33333-2.2222h2.22222l1.33333 2.2222c0.08431 0.1568 0.24911 0.2486 0.41895 0.2486 0.06541 0 0.13077-0.0144 0.19246-0.0433 0.22304-0.1041 0.32529-0.3648 0.23083-0.5892l-1.39935-3.325c-0.03033-0.0722-0.07499-0.1383-0.13074-0.1941l-7.28168-7.28174c-0.11945-0.11736-0.28295-0.18324-0.44925-0.18324z"
                    fill="currentColor"
                    fillRule="evenodd"
                    clipRule="evenodd"
                  ></path>
                </svg>
                <span>
                  {selectedTagIds.length === 0
                    ? "Wybierz tagi"
                    : `${selectedTagIds.length} ${selectedTagIds.length === 1 ? "tag" : "tagi"}`}
                </span>
              </span>
              <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 opacity-50"
              >
                <path
                  d="m4.93179 5.43179c0.20081-0.20081 0.55785-0.20081 0.75866 0l2.31055 2.31055 2.31055-2.31055c0.20081-0.20081 0.55785-0.20081 0.75866 0 0.20081 0.20081 0.20081 0.55785 0 0.75866l-2.68988 2.68988c-0.20081 0.20081-0.55785 0.20081-0.75866 0l-2.68988-2.68988c-0.20081-0.20081-0.20081-0.55785 0-0.75866z"
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                ></path>
              </svg>
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

        {selectedTagIds.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAllTags} className="text-xs">
            Wyczyść wszystkie
          </Button>
        )}
      </div>

      {/* Wybrane tagi jako Badge */}
      {selectedTags.length > 0 && (
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
                <svg width="12" height="12" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="m11.7816 4.03157c0.1462-0.14615 0.1462-0.38308 0-0.52923-0.1461-0.14616-0.3831-0.14616-0.5292 0l-3.25234 3.25234-3.25234-3.25234c-0.14615-0.14616-0.38308-0.14616-0.52923 0-0.14616 0.14615-0.14616 0.38308 0 0.52923l3.25234 3.25237-3.25234 3.2523c-0.14616 0.1462-0.14616 0.3831 0 0.5293 0.14615 0.1461 0.38308 0.1461 0.52923 0l3.25234-3.2523 3.25234 3.2523c0.1461 0.1461 0.3831 0.1461 0.5292 0 0.1462-0.1462 0.1462-0.3831 0-0.5293l-3.2523-3.2523 3.2523-3.25237z"
                    fill="currentColor"
                    fillRule="evenodd"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default TagFilter;

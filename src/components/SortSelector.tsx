import React from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import type { RecipeSortOption } from "../types";
import type { LucideIcon } from "lucide-react";
import { ArrowDownAZ, ArrowDownZA, SortAsc, SortDesc } from "lucide-react";

interface SortSelectorProps {
  currentSort: RecipeSortOption;
  onSortChange: (sort: RecipeSortOption) => void;
  disabled?: boolean;
  hideLabel?: boolean;
}

const sortOptions: { value: RecipeSortOption; label: string; icon: LucideIcon }[] = [
  { value: "created_at:desc", label: "Najnowsze", icon: SortDesc },
  { value: "created_at:asc", label: "Najstarsze", icon: SortAsc },
  { value: "name:asc", label: "Nazwa A-Z", icon: ArrowDownAZ },
  { value: "name:desc", label: "Nazwa Z-A", icon: ArrowDownZA },
];

const SortSelector: React.FC<SortSelectorProps> = ({
  currentSort,
  onSortChange,
  disabled = false,
  hideLabel = false,
}) => {
  const currentOption = sortOptions.find((option) => option.value === currentSort);
  const CurrentIcon = currentOption?.icon;

  return (
    <div className="flex items-center gap-3">
      {!hideLabel && <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sortuj:</span>}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={hideLabel ? "justify-between min-w-[120px]" : "justify-between min-w-[140px]"}
            aria-label="Wybierz sposób sortowania"
          >
            <span className="flex items-center gap-2">
              {CurrentIcon && <CurrentIcon className="h-4 w-4" />}
              <span>{currentOption?.label || "Wybierz"}</span>
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
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-48">
          {sortOptions.map((option) => {
            const Icon = option.icon;
            return (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onSortChange(option.value)}
                className={`flex items-center gap-3 cursor-pointer ${
                  currentSort === option.value ? "bg-accent text-accent-foreground" : ""
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1">{option.label}</span>
                {currentSort === option.value && (
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                  >
                    <path
                      d="m11.4669 3.72684c0.1664-0.1664 0.4357-0.1664 0.6021 0 0.1664 0.16641 0.1664 0.43569 0 0.6021l-6.5 6.5c-0.1664 0.1664-0.4357 0.1664-0.6021 0l-2.5-2.5c-0.16641-0.1664-0.16641-0.4357 0-0.6021 0.16641-0.1664 0.43569-0.1664 0.6021 0l2.1989 2.1989 6.1989-6.1989z"
                      fill="currentColor"
                      fillRule="evenodd"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default SortSelector;

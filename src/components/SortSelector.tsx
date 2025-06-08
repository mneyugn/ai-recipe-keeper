import React from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Button } from "./ui/button";

type SortOption = "created_at:desc" | "created_at:asc" | "name:asc" | "name:desc";

interface SortSelectorProps {
  currentSort: string;
  onSortChange: (sort: string) => void;
  disabled?: boolean;
}

const sortOptions: { value: SortOption; label: string; icon: string }[] = [
  { value: "created_at:desc", label: "Najnowsze", icon: "↓" },
  { value: "created_at:asc", label: "Najstarsze", icon: "↑" },
  { value: "name:asc", label: "Nazwa A-Z", icon: "🔤" },
  { value: "name:desc", label: "Nazwa Z-A", icon: "🔤" },
];

const SortSelector: React.FC<SortSelectorProps> = ({ currentSort, onSortChange, disabled = false }) => {
  const currentOption = sortOptions.find((option) => option.value === currentSort);

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sortuj:</span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className="justify-between min-w-[140px]"
            aria-label="Wybierz sposób sortowania"
          >
            <span className="flex items-center gap-2">
              <span>{currentOption?.icon}</span>
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
          {sortOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onSortChange(option.value)}
              className={`flex items-center gap-3 cursor-pointer ${
                currentSort === option.value ? "bg-accent text-accent-foreground" : ""
              }`}
            >
              <span className="text-lg">{option.icon}</span>
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
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default SortSelector;

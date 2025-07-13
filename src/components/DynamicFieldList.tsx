import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { XIcon, PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DynamicFieldListProps {
  items: string[];
  setItems: (items: string[]) => void;
  label: string;
  fieldPlaceholder?: string;
  addButtonLabel: string;
  minItems?: number;
  maxItems?: number;
  maxCharsPerItem?: number;
  fieldType: "input" | "textarea";
  textareaRows?: number;
  fieldLabel?: (index: number) => string; // Optional label for each field e.g. "Step {index + 1}"
  error?: string;
  "data-testid"?: string;
}

const DynamicFieldList: React.FC<DynamicFieldListProps> = ({
  items,
  setItems,
  label,
  fieldPlaceholder = "",
  addButtonLabel,
  minItems = 0,
  maxItems = Infinity,
  maxCharsPerItem,
  fieldType,
  textareaRows = 3,
  fieldLabel,
  error,
  "data-testid": testId,
}) => {
  const handleAddItem = () => {
    if (items.length < maxItems) {
      setItems([...items, ""]);
    }
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > minItems) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  const handleItemChange = (index: number, value: string) => {
    let Wartość = value;
    if (maxCharsPerItem && value.length > maxCharsPerItem) {
      Wartość = value.slice(0, maxCharsPerItem);
    }
    const newItems = items.map((item, i) => (i === index ? Wartość : item));
    setItems(newItems);
  };

  return (
    <div className="space-y-2" data-testid={testId}>
      <Label className="font-medium">{label}</Label>
      <div className="space-y-3" data-testid={`${testId}-items`}>
        {items.map((item, index) => (
          <div key={index} className="flex gap-2" data-testid={`${testId}-item-${index}`}>
            {fieldLabel && (
              <Label htmlFor={`${label.toLowerCase().replace(/\s+/g, "-")}-${index}`} className="text-sm font-normal">
                {fieldLabel(index)}
              </Label>
            )}
            {fieldType === "input" ? (
              <Input
                id={`${label.toLowerCase().replace(/\s+/g, "-")}-${index}`}
                type="text"
                value={item}
                onChange={(e) => handleItemChange(index, e.target.value)}
                placeholder={fieldPlaceholder}
                maxLength={maxCharsPerItem}
                className={cn(error && "border-red-500")}
                data-testid={`${testId}-input-${index}`}
              />
            ) : (
              <Textarea
                id={`${label.toLowerCase().replace(/\s+/g, "-")}-${index}`}
                value={item}
                onChange={(e) => handleItemChange(index, e.target.value)}
                placeholder={fieldPlaceholder}
                rows={textareaRows}
                maxLength={maxCharsPerItem}
                className={cn(error && "border-red-500")}
                data-testid={`${testId}-textarea-${index}`}
              />
            )}
            {maxCharsPerItem && (
              <p className="text-xs text-gray-500 text-right">
                {item.length}/{maxCharsPerItem}
              </p>
            )}
            {items.length > minItems && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleRemoveItem(index)}
                className="shrink-0"
                data-testid={`${testId}-remove-${index}`}
              >
                <XIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-500 mt-1" data-testid={`${testId}-error`}>
          {error}
        </p>
      )}

      {items.length < maxItems && (
        <Button
          type="button"
          variant="outline"
          onClick={handleAddItem}
          className="mt-2"
          data-testid={`${testId}-add-button`}
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          {addButtonLabel}
        </Button>
      )}
    </div>
  );
};

export default DynamicFieldList;

import React, { useCallback, useMemo, useState, useEffect } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { XIcon, PlusIcon, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

// Item with unique ID for stable sorting
interface DynamicFieldItem {
  id: string;
  value: string;
}

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

// Individual sortable item component
interface SortableItemProps {
  item: DynamicFieldItem;
  index: number;
  fieldType: "input" | "textarea";
  textareaRows?: number;
  fieldPlaceholder?: string;
  fieldLabel?: (index: number) => string;
  maxCharsPerItem?: number;
  onRemove: (id: string) => void;
  onUpdate: (id: string, value: string) => void;
  canRemove: boolean;
  testId?: string;
}

const SortableItem: React.FC<SortableItemProps> = ({
  item,
  index,
  fieldType,
  textareaRows = 3,
  fieldPlaceholder,
  fieldLabel,
  maxCharsPerItem,
  onRemove,
  onUpdate,
  canRemove,
  testId,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const characterCount = item.value.length;
  const isNearLimit = maxCharsPerItem && characterCount >= maxCharsPerItem * 0.8;
  const isOverLimit = maxCharsPerItem && characterCount > maxCharsPerItem;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("group relative", isDragging && "opacity-50 z-50")}
      data-testid={`${testId}-item-${index}`}
    >
      <div className="flex items-center gap-3 p-2.5 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="flex items-center justify-center w-5 h-5 opacity-40 group-hover:opacity-60 transition-opacity cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </div>

        <div className="flex-1 min-w-0">
          {fieldLabel && (
            <Label htmlFor={`field-${item.id}`} className="text-xs text-muted-foreground mb-1 block">
              {fieldLabel(index)}
            </Label>
          )}
          {fieldType === "textarea" ? (
            <Textarea
              id={`field-${item.id}`}
              value={item.value}
              onChange={(e) => onUpdate(item.id, e.target.value)}
              placeholder={fieldPlaceholder}
              rows={textareaRows}
              className="border-0 p-0 focus-visible:ring-0 resize-none bg-transparent"
              maxLength={maxCharsPerItem}
            />
          ) : (
            <Input
              id={`field-${item.id}`}
              value={item.value}
              onChange={(e) => onUpdate(item.id, e.target.value)}
              placeholder={fieldPlaceholder}
              className="border-0 p-0 focus-visible:ring-0 bg-transparent"
              maxLength={maxCharsPerItem}
            />
          )}
        </div>

        <div className="flex items-center gap-2">
          {maxCharsPerItem && (
            <span
              className={cn(
                "text-xs min-w-[45px] text-right transition-colors",
                isOverLimit ? "text-destructive" : isNearLimit ? "text-amber-600" : "text-muted-foreground"
              )}
            >
              {characterCount}/{maxCharsPerItem}
            </span>
          )}

          {canRemove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(item.id)}
              className="h-6 w-6 p-0 opacity-60 hover:opacity-100 transition-opacity"
              data-testid={`${testId}-remove-${index}`}
            >
              <XIcon className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const DynamicFieldList: React.FC<DynamicFieldListProps> = ({
  items,
  setItems,
  label,
  fieldPlaceholder = "Wprowadź wartość...",
  addButtonLabel,
  minItems = 1,
  maxItems = 20,
  maxCharsPerItem,
  fieldType,
  textareaRows = 3,
  fieldLabel,
  error,
  "data-testid": testId = "dynamic-field-list",
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // State to store stable IDs for items
  const [itemsWithIds, setItemsWithIds] = useState<DynamicFieldItem[]>([]);

  // Update items with stable IDs when items prop changes
  useEffect(() => {
    setItemsWithIds((prevItemsWithIds) => {
      // If items array length changed or values changed, update accordingly
      const newItemsWithIds: DynamicFieldItem[] = [];

      items.forEach((value, index) => {
        // Try to find existing item with same value and preserve its ID
        const existingItem = prevItemsWithIds.find(
          (prevItem, prevIndex) => prevItem.value === value && prevIndex === index
        );

        if (existingItem) {
          newItemsWithIds.push(existingItem);
        } else {
          // Create new item with unique ID
          newItemsWithIds.push({
            id: crypto.randomUUID(),
            value,
          });
        }
      });

      return newItemsWithIds;
    });
  }, [items]);

  // Convert string array to items with stable IDs
  const itemsForRendering = useMemo(() => {
    // Ensure we have the latest values
    return itemsWithIds.map((item, index) => ({
      ...item,
      value: items[index] || item.value,
    }));
  }, [items, itemsWithIds]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (active.id !== over?.id) {
        const oldIndex = itemsForRendering.findIndex((item) => item.id === active.id);
        const newIndex = itemsForRendering.findIndex((item) => item.id === over?.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newOrder = arrayMove(items, oldIndex, newIndex);
          setItems(newOrder);
        }
      }
    },
    [itemsForRendering, items, setItems]
  );

  const addItem = useCallback(() => {
    if (items.length < maxItems) {
      setItems([...items, ""]);
    }
  }, [items, maxItems, setItems]);

  const removeItem = useCallback(
    (id: string) => {
      if (items.length > minItems) {
        const indexToRemove = itemsForRendering.findIndex((item) => item.id === id);
        if (indexToRemove !== -1) {
          const newItems = items.filter((_, i) => i !== indexToRemove);
          setItems(newItems);
        }
      }
    },
    [items, minItems, itemsForRendering, setItems]
  );

  const updateItem = useCallback(
    (id: string, value: string) => {
      const indexToUpdate = itemsForRendering.findIndex((item) => item.id === id);
      if (indexToUpdate !== -1) {
        const newItems = [...items];
        newItems[indexToUpdate] = value;
        setItems(newItems);
      }
    },
    [items, itemsForRendering, setItems]
  );

  const canRemove = items.length > minItems;
  const canAdd = items.length < maxItems;

  return (
    <div className="space-y-3" data-testid={testId}>
      <Label className="text-base font-medium">{label}</Label>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={itemsForRendering.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2" data-testid={`${testId}-items`}>
            {itemsForRendering.map((item, index) => (
              <SortableItem
                key={item.id}
                item={item}
                index={index}
                fieldType={fieldType}
                textareaRows={textareaRows}
                fieldPlaceholder={fieldPlaceholder}
                fieldLabel={fieldLabel}
                maxCharsPerItem={maxCharsPerItem}
                onRemove={removeItem}
                onUpdate={updateItem}
                canRemove={canRemove}
                testId={testId}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {canAdd && (
        <Button
          type="button"
          variant="outline"
          onClick={addItem}
          className="w-full h-10 border-dashed"
          data-testid={`${testId}-add-button`}
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          {addButtonLabel}
        </Button>
      )}

      {error && (
        <p className="text-sm text-destructive" data-testid={`${testId}-error`}>
          {error}
        </p>
      )}
    </div>
  );
};

export default DynamicFieldList;

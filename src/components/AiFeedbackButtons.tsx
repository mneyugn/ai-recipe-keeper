import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import type { FeedbackType } from "@/types";

interface AiFeedbackButtonsProps {
  extractionLogId: string | null;
  currentFeedback: FeedbackType | null;
  onFeedbackSubmit: (feedback: FeedbackType) => Promise<void>;
  className?: string;
}

const AiFeedbackButtons: React.FC<AiFeedbackButtonsProps> = ({
  extractionLogId,
  currentFeedback,
  onFeedbackSubmit,
  className = "",
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFeedbackClick = async (feedback: FeedbackType) => {
    if (!extractionLogId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onFeedbackSubmit(feedback);
    } catch (error) {
      console.error("Error submitting feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!extractionLogId) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm text-gray-600">Oceń jakość ekstrakcji:</span>
      <Button
        type="button"
        variant={currentFeedback === "positive" ? "default" : "outline"}
        size="sm"
        onClick={() => handleFeedbackClick("positive")}
        disabled={isSubmitting}
        className="h-8 px-3"
      >
        {isSubmitting && currentFeedback !== "positive" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ThumbsUp className="h-4 w-4" />
        )}
      </Button>
      <Button
        type="button"
        variant={currentFeedback === "negative" ? "default" : "outline"}
        size="sm"
        onClick={() => handleFeedbackClick("negative")}
        disabled={isSubmitting}
        className="h-8 px-3"
      >
        {isSubmitting && currentFeedback !== "negative" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ThumbsDown className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};

export default AiFeedbackButtons;

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { ExtractionLimitCardProps } from "../../types";

/**
 * ExtractionLimitCard component displaying extraction limits with progress bar
 * Shows used/total limits, percentage and reset date
 */
export function ExtractionLimitCard({ extractionLimit }: ExtractionLimitCardProps) {
  const { used, limit, percentageUsed, isLimitExceeded, resetDateFormatted } = extractionLimit;

  const textColor = isLimitExceeded ? "text-red-600" : percentageUsed > 80 ? "text-yellow-600" : "text-green-600";

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-900">Limity ekstrakcji AI</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Usage Stats */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Wykorzystane</span>
            <div className="flex items-center space-x-2">
              <span className={`text-lg font-bold ${textColor}`}>
                {used}/{limit}
              </span>
              <Badge
                variant={isLimitExceeded ? "destructive" : percentageUsed > 80 ? "secondary" : "default"}
                className="text-xs"
              >
                {percentageUsed}%
              </Badge>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={Math.min(percentageUsed, 100)} className="h-3" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0</span>
              <span>{limit}</span>
            </div>
          </div>
        </div>

        {/* Status Message */}
        <div className="pt-4 border-t border-gray-200">
          {isLimitExceeded ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium text-red-600">Limit wyczerpany</span>
              </div>
              <p className="text-xs text-gray-600">Nie możesz już używać funkcji ekstrakcji AI do końca okresu.</p>
            </div>
          ) : percentageUsed > 80 ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium text-yellow-600">Zbliżasz się do limitu</span>
              </div>
              <p className="text-xs text-gray-600">Pozostało {limit - used} ekstrakcji do końca okresu.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-600">Limit dostępny</span>
              </div>
              <p className="text-xs text-gray-600">Możesz jeszcze wykonać {limit - used} ekstrakcji.</p>
            </div>
          )}
        </div>

        {/* Reset Date */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Odnowienie limitu</span>
            <span className="text-sm font-medium text-gray-900">{resetDateFormatted}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

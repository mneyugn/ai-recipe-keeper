import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { UserInfoCardProps } from "../../types";

/**
 * UserInfoCard component displaying basic user information
 * Shows email, username, recipe count and member since date
 */
export function UserInfoCard({ email, username, recipeCount, memberSince }: UserInfoCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-900">Informacje o koncie</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User Avatar and Basic Info */}
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <div className="h-full w-full bg-gray-200 rounded-full flex items-center justify-center">
              {/* <span className="text-lg font-semibold text-gray-600">{username.charAt(0).toUpperCase()}</span> */}
            </div>
          </Avatar>
          <div className="space-y-1">
            {/* <h3 className="text-lg font-medium text-gray-900">{username}</h3> */}
            <p className="text-sm text-gray-600">{email}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          <div className="space-y-1">
            <p className="text-sm text-gray-600">Liczba przepisów</p>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-gray-900">{recipeCount}</span>
              <Badge variant="secondary" className="text-xs">
                {recipeCount === 1 ? "przepis" : recipeCount < 5 ? "przepisy" : "przepisów"}
              </Badge>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-gray-600">Status członkostwa</p>
            <p className="text-sm font-medium text-gray-900">{memberSince}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

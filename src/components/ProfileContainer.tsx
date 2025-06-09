import { useUserProfile } from "./hooks/useUserProfile";
import { useLogout } from "./hooks/useLogout";
import { UserInfoCard } from "./profile/UserInfoCard";
import { ExtractionLimitCard } from "./profile/ExtractionLimitCard";
import { LogoutButton } from "./profile/LogoutButton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * ProfileContainer - Main container component for user profile page
 * Manages profile data fetching and integrates all profile subcomponents
 */
export function ProfileContainer() {
  const { profile, isLoading, error, refetch } = useUserProfile();
  const { logout, isLoading: isLogoutLoading, error: logoutError } = useLogout();

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Loading skeleton for header */}
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded animate-pulse w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-96"></div>
          </div>

          {/* Loading skeletons for cards */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="w-full">
              <CardContent className="p-6 space-y-4">
                <div className="h-6 bg-gray-200 rounded animate-pulse w-32"></div>
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-5 bg-gray-200 rounded animate-pulse w-24"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-40"></div>
                  </div>
                </div>
                <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>

            <Card className="w-full">
              <CardContent className="p-6 space-y-4">
                <div className="h-6 bg-gray-200 rounded animate-pulse w-40"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-full"></div>
                  <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Loading skeleton for logout button */}
          <div className="flex justify-end">
            <div className="h-10 bg-gray-200 rounded animate-pulse w-32"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertDescription className="text-red-700">
            <div className="space-y-2">
              <p className="font-medium">Wystąpił błąd podczas ładowania profilu:</p>
              <p className="text-sm">{error}</p>
            </div>
          </AlertDescription>
        </Alert>

        <div className="flex justify-center">
          <Button onClick={refetch} variant="outline">
            Spróbuj ponownie
          </Button>
        </div>
      </div>
    );
  }

  // No data state (shouldn't happen if API works correctly)
  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Alert className="mb-6">
          <AlertDescription>Nie udało się załadować danych profilu. Spróbuj odświeżyć stronę.</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Success state - render profile data
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profil użytkownika</h1>
        <p className="text-gray-600">Zarządzaj swoim kontem i śledź wykorzystanie funkcji AI</p>
      </div>

      {/* Logout Error Alert */}
      {logoutError && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertDescription className="text-red-700">
            <div className="space-y-2">
              <p className="font-medium">Błąd podczas wylogowania:</p>
              <p className="text-sm">{logoutError}</p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Profile Content */}
      <div className="space-y-6">
        {/* Profile Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* User Info Card */}
          <UserInfoCard
            email={profile.email}
            username={profile.username}
            recipeCount={profile.recipeCount}
            memberSince={profile.memberSinceFormatted}
          />

          {/* Extraction Limit Card */}
          <ExtractionLimitCard extractionLimit={profile.extractionLimit} />
        </div>

        {/* Actions Section */}
        <div className="flex justify-end pt-6 border-t border-gray-200">
          <LogoutButton onLogout={logout} isLoading={isLogoutLoading} />
        </div>
      </div>
    </div>
  );
}

import * as React from 'react';
import { api, ApiError } from '@/lib/api';
import type { AppPublic, UserAppAccess } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AppWindow, Clock } from 'lucide-react';
import { RequestAccessModal } from './RequestAccessModal';

interface PublicAppsListProps {
  userApps: UserAppAccess[];
}

export function PublicAppsList({ userApps }: PublicAppsListProps) {
  const [publicApps, setPublicApps] = React.useState<AppPublic[]>([]);
  const [pendingRequests, setPendingRequests] = React.useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedApp, setSelectedApp] = React.useState<AppPublic | null>(null);

  const userAppSlugs = React.useMemo(
    () => new Set(userApps.map((a) => a.app_slug)),
    [userApps]
  );

  React.useEffect(() => {
    async function fetchPublicApps() {
      try {
        const apps = await api.auth.publicApps();
        setPublicApps(apps);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('Failed to load public apps');
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchPublicApps();
  }, []);

  const availableApps = publicApps.filter((app) => !userAppSlugs.has(app.slug));

  const handleRequestSuccess = (slug: string) => {
    setPendingRequests((prev) => new Set([...prev, slug]));
    setSelectedApp(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (availableApps.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/30">
        <p>No public apps available for access requests.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border divide-y">
        {availableApps.map((app) => {
          const isPending = pendingRequests.has(app.slug);

          return (
            <div
              key={app.slug}
              className="flex items-center justify-between p-4 gap-4"
            >
              <div className="flex items-start gap-3 min-w-0">
                <AppWindow className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-medium">{app.name}</p>
                  {app.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {app.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex-shrink-0">
                {isPending ? (
                  <Badge variant="secondary" className="gap-1">
                    <Clock className="h-3 w-3" />
                    Pending
                  </Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedApp(app)}
                  >
                    Request Access
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedApp && (
        <RequestAccessModal
          app={selectedApp}
          onClose={() => setSelectedApp(null)}
          onSuccess={() => handleRequestSuccess(selectedApp.slug)}
        />
      )}
    </>
  );
}

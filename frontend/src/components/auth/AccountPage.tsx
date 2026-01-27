import * as React from 'react';
import { api, ApiError } from '@/lib/api';
import type { User } from '@/lib/api';
import { PasskeyManager } from './PasskeyManager';
import { DeleteAccount } from './DeleteAccount';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, LogOut, ArrowLeft } from 'lucide-react';

interface AccountPageProps {
  appName: string;
}

export function AccountPage({ appName }: AccountPageProps) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSigningOut, setIsSigningOut] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchUser() {
      try {
        const userData = await api.auth.me();
        setUser(userData);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          window.location.href = '/signin?redirect=/account';
          return;
        }
        setError('Failed to load user data');
      } finally {
        setIsLoading(false);
      }
    }
    fetchUser();
  }, []);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await api.auth.signout();
      window.location.href = '/signin';
    } catch {
      setIsSigningOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{error || 'Please sign in to continue'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{appName}</h1>
            <p className="text-muted-foreground">Account Settings</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <a href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </a>
            </Button>
            <Button variant="outline" onClick={handleSignOut} disabled={isSigningOut}>
              {isSigningOut ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4 mr-2" />
              )}
              Sign Out
            </Button>
          </div>
        </div>

        <div className="p-4 rounded-lg border bg-muted/50">
          <p className="text-sm text-muted-foreground">Signed in as</p>
          <p className="font-medium">{user.email}</p>
          {user.is_admin && (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary mt-1">
              Admin
            </span>
          )}
        </div>

        <PasskeyManager />

        <DeleteAccount isSeeded={user.is_seeded} />
      </div>
    </div>
  );
}

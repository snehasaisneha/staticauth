import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api, ApiError } from '@/lib/api';
import { Loader2, Trash2 } from 'lucide-react';

interface DeleteAccountProps {
  isSeeded: boolean;
}

export function DeleteAccount({ isSeeded }: DeleteAccountProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmText, setConfirmText] = React.useState('');

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') return;

    setIsDeleting(true);
    setError(null);

    try {
      await api.auth.deleteAccount();
      window.location.href = '/signin';
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to delete account');
      }
      setIsDeleting(false);
    }
  };

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <Trash2 className="h-5 w-5" />
          Delete Account
        </CardTitle>
        <CardDescription>
          Permanently delete your account and all associated data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isSeeded ? (
          <p className="text-sm text-muted-foreground">
            This is a seeded admin account and cannot be deleted.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. All your data, including passkeys and sessions, will be permanently deleted.
            </p>
            <div className="space-y-2">
              <label htmlFor="confirm" className="text-sm font-medium">
                Type <span className="font-mono font-bold">DELETE</span> to confirm
              </label>
              <input
                id="confirm"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="DELETE"
              />
            </div>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || confirmText !== 'DELETE'}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete Account
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

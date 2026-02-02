import * as React from 'react';
import { AuthProvider, useRequireAuth, useAuth } from '../AuthContext';
import { TopBar } from '../TopBar';
import { AdminDashboard } from './AdminDashboard';
import { Loader2, ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminPageProps {
  appName: string;
}

function AdminPageContent({ appName }: AdminPageProps) {
  const { user, loading: authLoading } = useRequireAuth();
  const { isAdmin } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useRequireAuth
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopBar appName={appName} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <ShieldX className="h-16 w-16 text-muted-foreground mx-auto" />
            <h2 className="text-2xl font-bold">Access Denied</h2>
            <p className="text-muted-foreground">
              You don't have permission to access this page.
            </p>
            <Button asChild>
              <a href="/">Go back home</a>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar appName={appName} />
      <main className="flex-1 container mx-auto px-4 py-8">
        <AdminDashboard />
      </main>
    </div>
  );
}

export function AdminPage(props: AdminPageProps) {
  return (
    <AuthProvider>
      <AdminPageContent {...props} />
    </AuthProvider>
  );
}

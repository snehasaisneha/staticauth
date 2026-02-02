import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserList } from './UserList';
import { PendingRegistrations } from './PendingRegistrations';
import { AppManagement } from './AppManagement';
import { AddUserModal } from './AddUserModal';
import { UserPlus, AppWindow, Users } from 'lucide-react';

type TabType = 'users' | 'apps';

export function AdminDashboard() {
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [activeTab, setActiveTab] = React.useState<TabType>('users');
  const [showAddUserModal, setShowAddUserModal] = React.useState(false);

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  const handleAddUserSuccess = () => {
    setShowAddUserModal(false);
    handleRefresh();
  };

  return (
    <div className="space-y-6" key={refreshKey}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users and apps</p>
        </div>
        {activeTab === 'users' && (
          <Button onClick={() => setShowAddUserModal(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'users'
              ? 'border-primary text-primary font-medium'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="h-4 w-4" />
          Users
        </button>
        <button
          onClick={() => setActiveTab('apps')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'apps'
              ? 'border-primary text-primary font-medium'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <AppWindow className="h-4 w-4" />
          Apps
        </button>
      </div>

      {activeTab === 'users' && (
        <>
          {showAddUserModal && (
            <AddUserModal
              onClose={() => setShowAddUserModal(false)}
              onSuccess={handleAddUserSuccess}
            />
          )}

          <PendingRegistrations onAction={handleRefresh} />

          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>Manage all registered users</CardDescription>
            </CardHeader>
            <CardContent>
              <UserList onRefresh={handleRefresh} />
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === 'apps' && (
        <Card>
          <CardHeader>
            <CardTitle>App Management</CardTitle>
            <CardDescription>Manage apps and access permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <AppManagement onRefresh={handleRefresh} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

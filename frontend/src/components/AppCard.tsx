import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, AppWindow } from 'lucide-react';

interface AppCardProps {
  name: string;
  description?: string | null;
  url?: string | null;
  role?: string | null;
}

export function AppCard({ name, description, url, role }: AppCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <AppWindow className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <CardTitle className="text-lg">{name}</CardTitle>
          </div>
          {role && (
            <Badge variant="secondary" className="flex-shrink-0">
              {role}
            </Badge>
          )}
        </div>
        {description && (
          <CardDescription className="line-clamp-2">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-0 mt-auto">
        {url ? (
          <Button asChild className="w-full">
            <a href={url} target="_blank" rel="noopener noreferrer">
              Open
              <ExternalLink className="h-4 w-4 ml-2" />
            </a>
          </Button>
        ) : (
          <Button variant="outline" disabled className="w-full">
            No URL configured
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

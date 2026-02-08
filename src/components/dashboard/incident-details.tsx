"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Globe,
  ThumbsUp,
  FileText,
} from 'lucide-react';
import type { Incident } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';


const severityConfig = {
  critical: { name: 'Critical', color: 'bg-red-500', text: 'text-red-500' },
  severe: { name: 'Severe', color: 'bg-orange-500', text: 'text-orange-500' },
  moderate: { name: 'Moderate', color: 'bg-yellow-500', text: 'text-yellow-500' },
  minor: { name: 'Minor', color: 'bg-blue-500', text: 'text-blue-500' },
};

const statusConfig: { [key in Incident['status']]: { name: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' } } = {
  'new': { name: 'New', variant: 'destructive' },
  'acknowledged': { name: 'Acknowledged', variant: 'secondary' },
  'in-progress': { name: 'In Progress', variant: 'default' },
  'resolved': { name: 'Resolved', variant: 'outline' },
  'false-positive': { name: 'False Positive', variant: 'outline' },
}

export default function IncidentDetails({
  incident,
  onClose,
  onUpdateIncident
}: {
  incident: Incident | null;
  onClose: () => void;
  onUpdateIncident: (incident: Incident) => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();

  if (!incident) return null;

  const handleStatusChange = (status: Incident['status']) => {
    onUpdateIncident({ ...incident, status });
    toast({
      title: "Incident Status Updated",
      description: `${incident.id} marked as ${statusConfig[status].name}.`,
    })
  };

  const severity = severityConfig[incident.severity];

  return (
    <Sheet open={!!incident} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-lg w-full flex flex-col">
        <SheetHeader className="pr-10">
          <SheetTitle className="text-2xl font-bold font-headline truncate">
            {incident.type} at {incident.location}
          </SheetTitle>
          <SheetDescription>Incident ID: {incident.id}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto pr-6 pl-6 -mr-6">
          <div className="space-y-4 my-4">
            <div className="flex items-center justify-between">
              <Badge variant={statusConfig[incident.status].variant} className="text-sm">{statusConfig[incident.status].name}</Badge>
              <div className="flex items-center gap-2">
                <div className={cn("h-3 w-3 rounded-full", severity.color)}></div>
                <span className={cn("font-semibold", severity.text)}>{severity.name}</span>
              </div>
            </div>

            <Separator />

            <p className="text-sm leading-relaxed">{incident.summary}</p>

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-sm mt-4">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-semibold">Reported Time</p>
                  <p className="text-muted-foreground">{format(new Date(incident.timestamp), "MMM d, yyyy 'at' h:mm a")}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-semibold">Coordinates</p>
                  <p className="text-muted-foreground">{incident.coordinates.lat.toFixed(4)}, {incident.coordinates.lng.toFixed(4)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ThumbsUp className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-semibold">AI Confidence</p>
                  <p className="text-muted-foreground">{incident.confidence}%</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-semibold">Total Sources</p>
                  <p className="text-muted-foreground">{incident.posts.length} related posts</p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                < Globe className="h-4 w-4" />
                Related Source Posts
              </h3>
              <div className="space-y-3">
                {incident.posts.map((post, idx) => (
                  <div key={idx} className="group relative bg-muted/30 p-3 rounded-md border border-transparent hover:border-primary/20 hover:bg-muted/50 transition-all">
                    <p className="text-xs italic text-muted-foreground mb-1">Source #{idx + 1}</p>
                    <p className="text-sm leading-snug break-words">
                      {post.url ? (
                        <a
                          href={post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary transition-colors hover:underline decoration-primary/30 underline-offset-4"
                          title="Click to view original post"
                        >
                          {post.text}
                        </a>
                      ) : (
                        post.text
                      )}
                    </p>
                    {post.url && (
                      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Globe className="h-3 w-3 text-primary" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {user?.role === 'authority' && (
          <SheetFooter className="mt-auto pt-4 border-t">
            <div className="flex flex-wrap gap-2 justify-end">
              {incident.status === 'new' && <Button onClick={() => handleStatusChange('acknowledged')}><CheckCircle /> Acknowledge</Button>}
              {incident.status === 'acknowledged' && <Button onClick={() => handleStatusChange('in-progress')}>Start Progress</Button>}
              {incident.status === 'in-progress' && <Button onClick={() => handleStatusChange('resolved')}>Mark as Resolved</Button>}
              {incident.status !== 'false-positive' && incident.status !== 'resolved' && <Button variant="outline" onClick={() => handleStatusChange('false-positive')}><AlertTriangle /> Mark as False Positive</Button>}
            </div>
          </SheetFooter>
        )}

        {user?.role === 'admin' && (
          <SheetFooter className="mt-auto pt-4 border-t">
            <Button variant="destructive">Delete Incident</Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}

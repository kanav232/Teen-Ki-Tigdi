
'use client';

import { Incident } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface IncidentSidebarProps {
    incidents: Incident[];
    onSelectIncident: (incident: Incident) => void;
    selectedIncidentId?: string;
}

export default function IncidentSidebar({ incidents, onSelectIncident, selectedIncidentId }: IncidentSidebarProps) {
    return (
        <div className="h-full flex flex-col border-r bg-background">
            <div className="p-4 border-b">
                <h2 className="text-xl font-bold">Emergency Feed</h2>
                <p className="text-sm text-muted-foreground">
                    Live updates from social media channels
                </p>
            </div>

            <ScrollArea className="flex-1">
                <div className="flex flex-col gap-2 p-4">
                    {incidents.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                            No active incidents reported.
                        </div>
                    ) : (
                        incidents.map((incident) => (
                            <Card
                                key={incident.id}
                                className={`cursor-pointer transition-colors hover:bg-accent/50 ${selectedIncidentId === incident.id ? 'border-primary bg-accent' : ''}`}
                                onClick={() => onSelectIncident(incident)}
                            >
                                <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between space-y-0">
                                    <CardTitle className="text-sm font-medium">
                                        {incident.type}
                                    </CardTitle>
                                    <Badge variant={incident.severity === 'critical' || incident.severity === 'severe' ? 'destructive' : 'secondary'}>
                                        {incident.severity}
                                    </Badge>
                                </CardHeader>
                                <CardContent className="p-3">
                                    <div className="text-xs text-muted-foreground mb-1">
                                        {incident.location}
                                    </div>
                                    <div className={`text-xs ${selectedIncidentId === incident.id ? 'whitespace-pre-wrap' : 'line-clamp-2'}`}>
                                        {incident.summary}
                                    </div>
                                    <div className="mt-2 text-[10px] text-muted-foreground flex justify-between">
                                        <span>{new Date(incident.timestamp).toLocaleTimeString()}</span>
                                        <span>Confidence: {incident.confidence}%</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}

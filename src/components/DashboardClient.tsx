
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Incident } from '@/lib/types';
import MapWrapper from './MapWrapper';
import IncidentSidebar from './IncidentSidebar';

interface DashboardClientProps {
    incidents: Incident[];
}

export default function DashboardClient({ incidents }: DashboardClientProps) {
    const router = useRouter();
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

    // Fast-polling to ensure the frontend updates live
    useEffect(() => {
        const interval = setInterval(() => {
            router.refresh(); // Re-runs the server component fetch
        }, 3000); // 3 seconds for near time updates
        return () => clearInterval(interval);
    }, [router]);

    const isLocalMode = incidents.some(i => i.id.startsWith('mock-'));

    return (
        <div className="flex h-screen w-full flex-col overflow-hidden">

            <header className="flex items-center justify-between px-4 py-3 border-b bg-background z-10 shrink-0">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">🚨</span>
                    <h1 className="text-xl font-bold">Teen-Ki-Tigdi <span className="text-muted-foreground font-normal text-sm ml-2">Emergency Response</span></h1>
                </div>
                {isLocalMode && (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 border border-amber-200">
                        ⚠️ Local Demo Mode
                    </span>
                )}
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar - 1/3 width */}
                <div className="w-1/3 min-w-[320px] max-w-[450px] hidden md:block h-full border-r bg-background">
                    <IncidentSidebar
                        incidents={incidents}
                        onSelectIncident={setSelectedIncident}
                        selectedIncidentId={selectedIncident?.id}
                    />
                </div>

                {/* Map - 2/3 width */}
                <div className="flex-1 relative h-full bg-slate-100">
                    <MapWrapper incidents={incidents} selectedIncident={selectedIncident} />
                </div>
            </div>
        </div>
    );
}

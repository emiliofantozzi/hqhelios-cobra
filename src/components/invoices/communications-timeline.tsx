'use client';

/**
 * Timeline de comunicaciones del playbook
 * Story 3.7: Control Manual de Playbook Activo
 *
 * Muestra eventos del playbook en orden cronológico (más reciente primero):
 * - Playbook activado
 * - Playbook pausado
 * - Playbook reanudado
 * - Playbook completado
 *
 * Epic 4 agregará mensajes enviados y respuestas recibidas.
 */
import { useEffect, useState } from 'react';
import { Play, Pause, CheckCircle, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface TimelineEvent {
  id: string;
  type: 'playbook_started' | 'playbook_paused' | 'playbook_resumed' | 'playbook_completed';
  timestamp: string;
  note?: string;
  metadata?: { playbookName?: string };
}

interface CommunicationsTimelineProps {
  collectionId: string;
}

const EVENT_CONFIG: Record<
  TimelineEvent['type'],
  { icon: typeof Play; label: string; color: string }
> = {
  playbook_started: {
    icon: Play,
    label: 'Playbook activado',
    color: 'text-green-600',
  },
  playbook_paused: {
    icon: Pause,
    label: 'Playbook pausado',
    color: 'text-yellow-600',
  },
  playbook_resumed: {
    icon: Play,
    label: 'Playbook reanudado',
    color: 'text-green-600',
  },
  playbook_completed: {
    icon: CheckCircle,
    label: 'Playbook completado',
    color: 'text-blue-600',
  },
};

export function CommunicationsTimeline({ collectionId }: CommunicationsTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const fetchTimeline = async () => {
      try {
        const res = await fetch(`/api/collections/${collectionId}/timeline`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setEvents(data);
        }
      } catch (error) {
        // Ignorar errores de abort (componente desmontado)
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        console.error(`Error fetching timeline for collection ${collectionId}:`, error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimeline();

    return () => controller.abort();
  }, [collectionId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Comunicaciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Comunicaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              No hay comunicaciones registradas aún.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Las comunicaciones aparecerán aquí cuando se envíen mensajes.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Comunicaciones</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Línea vertical de conexión */}
          <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border" />

          <div className="space-y-6">
            {events.map((event) => {
              const config = EVENT_CONFIG[event.type];
              const Icon = config.icon;

              return (
                <div key={event.id} className="relative flex gap-4">
                  {/* Icono */}
                  <div
                    className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background border-2 ${config.color}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 pt-0.5">
                    <p className="text-sm font-medium">
                      {config.label}
                      {event.metadata?.playbookName && (
                        <span className="font-normal text-muted-foreground">
                          {' '}
                          - {event.metadata.playbookName}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(event.timestamp), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </p>
                    {event.note && (
                      <p className="text-sm text-muted-foreground mt-1 italic">
                        &quot;{event.note}&quot;
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

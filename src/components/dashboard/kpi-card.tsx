/**
 * KPI Card Component - Muestra una métrica principal con ícono
 * Story 2.8: Dashboard Básico con KPIs
 *
 * @module components/dashboard/kpi-card
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  description?: string;
}

/**
 * Card de KPI con ícono, valor principal, y descripción
 */
export function KPICard({
  title,
  value,
  icon: Icon,
  iconColor = 'text-muted-foreground',
  description,
}: KPICardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={cn('h-4 w-4', iconColor)} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

'use client';

/**
 * Overdue Chart Component - Gráfico de facturas vencidas por antigüedad
 * Story 2.8: Dashboard Básico con KPIs
 *
 * @module components/dashboard/overdue-chart
 */
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { OverdueSegment } from '@/lib/services/dashboard-service';

interface OverdueChartProps {
  data: OverdueSegment[];
}

const SEGMENT_COLORS: Record<string, string> = {
  '0-7': '#eab308', // yellow-500
  '8-15': '#f97316', // orange-500
  '16-30': '#ef4444', // red-500
  '30+': '#991b1b', // red-900
};

const SEGMENT_LABELS: Record<string, string> = {
  '0-7': '0-7 días',
  '8-15': '8-15 días',
  '16-30': '16-30 días',
  '30+': '30+ días',
};

/**
 * Gráfico de barras de facturas vencidas por segmento de antigüedad
 */
export function OverdueChart({ data }: OverdueChartProps) {
  const totalOverdue = data.reduce((sum, seg) => sum + seg.count, 0);

  if (totalOverdue === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Facturas Vencidas por Antigüedad</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No hay facturas vencidas
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((seg) => ({
    segment: SEGMENT_LABELS[seg.segment],
    count: seg.count,
    color: SEGMENT_COLORS[seg.segment],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Facturas Vencidas por Antigüedad</CardTitle>
        <p className="text-sm text-muted-foreground">
          Total: {totalOverdue} facturas vencidas
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="segment" />
            <YAxis allowDecimals={false} />
            <Tooltip
              formatter={(value: number) => [`${value} facturas`, 'Cantidad']}
            />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

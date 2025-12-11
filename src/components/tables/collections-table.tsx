'use client';

/**
 * DataTable de collections con sorting, filtering y paginación
 * Story 4.5: Visibilidad de Mensajes Programados
 *
 * @module components/tables/collections-table
 */
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type ColumnDef,
  type SortingState,
  flexRender,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { CollectionListItem } from '@/lib/services/collection-service';

interface CollectionsTableProps {
  data: CollectionListItem[];
}

/**
 * Badge de estado de collection
 */
function CollectionStatusBadge({ status }: { status: string }) {
  const config: Record<string, { className: string; label: string }> = {
    active: { className: 'bg-green-100 text-green-700 border-green-200', label: 'Activo' },
    paused: { className: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'Pausado' },
    awaiting_response: { className: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Esperando' },
    pending_review: { className: 'bg-purple-100 text-purple-700 border-purple-200', label: 'En revisión' },
    completed: { className: 'bg-gray-100 text-gray-700 border-gray-200', label: 'Completado' },
    escalated: { className: 'bg-red-100 text-red-700 border-red-200', label: 'Escalado' },
  };

  const cfg = config[status] || { className: 'bg-gray-100 text-gray-700', label: status };

  return (
    <Badge variant="outline" className={cn('text-xs', cfg.className)}>
      {cfg.label}
    </Badge>
  );
}

/**
 * Tabla de collections con TanStack Table
 */
export function CollectionsTable({ data }: CollectionsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filtrar datos por estado
  const filteredData = useMemo(() => {
    if (statusFilter === 'all') return data;
    return data.filter((collection) => collection.status === statusFilter);
  }, [data, statusFilter]);

  const columns: ColumnDef<CollectionListItem>[] = useMemo(
    () => [
      {
        accessorKey: 'invoice.invoiceNumber',
        header: 'Factura',
        cell: ({ row }) => (
          <Link
            href={`/invoices/${row.original.invoice.id}`}
            className="font-medium text-blue-600 hover:underline"
          >
            {row.original.invoice.invoiceNumber}
          </Link>
        ),
      },
      {
        accessorKey: 'company.name',
        header: 'Empresa',
        cell: ({ row }) => (
          <Link
            href={`/companies/${row.original.company.id}`}
            className="text-gray-900 hover:text-blue-600"
          >
            {row.original.company.name}
          </Link>
        ),
      },
      {
        accessorKey: 'playbook.name',
        header: 'Playbook',
        cell: ({ row }) => (
          <span className="text-sm">{row.original.playbook.name}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        cell: ({ row }) => <CollectionStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'nextActionAt',
        header: 'Próximo Mensaje',
        cell: ({ row }) => {
          if (!row.original.nextActionAt) {
            return <span className="text-sm text-gray-400">-</span>;
          }
          const date = new Date(row.original.nextActionAt);
          const isPast = date < new Date();
          return (
            <div className="text-sm">
              <div className={cn(isPast && 'text-orange-600 font-medium')}>
                {format(date, 'd MMM, HH:mm', { locale: es })}
              </div>
              <div className="text-xs text-gray-500">
                {formatDistanceToNow(date, { addSuffix: true, locale: es })}
              </div>
            </div>
          );
        },
      },
      {
        id: 'progress',
        header: 'Progreso',
        cell: ({ row }) => {
          const sent = row.original.messagesSentCount;
          const total = row.original.totalMessages;
          const percentage = total > 0 ? Math.round((sent / total) * 100) : 0;
          return (
            <div className="flex items-center gap-2">
              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-gray-600">
                {sent}/{total}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'invoice.amount',
        header: 'Monto',
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.invoice.currency}{' '}
            {Number(row.original.invoice.amount).toLocaleString('es-MX', {
              minimumFractionDigits: 2,
            })}
          </span>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 25 },
    },
  });

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-4">
        <Input
          placeholder="Buscar por factura o empresa..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="active">Activo</SelectItem>
            <SelectItem value="paused">Pausado</SelectItem>
            <SelectItem value="awaiting_response">Esperando respuesta</SelectItem>
            <SelectItem value="pending_review">En revisión</SelectItem>
            <SelectItem value="completed">Completado</SelectItem>
            <SelectItem value="escalated">Escalado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === 'asc' && ' ↑'}
                    {header.column.getIsSorted() === 'desc' && ' ↓'}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No se encontraron cobranzas
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {table.getFilteredRowModel().rows.length} cobranzas
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={String(table.getState().pagination.pageSize)}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <span className="text-sm">
            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount() || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
}

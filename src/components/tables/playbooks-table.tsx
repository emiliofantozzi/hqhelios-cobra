'use client';

/**
 * DataTable de playbooks con sorting, filtering y paginación
 *
 * @module components/tables/playbooks-table
 */
import { useState, useMemo } from 'react';
import Link from 'next/link';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Copy, Edit, XCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TRIGGER_TYPE_LABELS } from '@/lib/validations/playbook-schema';

/**
 * Tipo de playbook para la tabla
 */
export interface PlaybookRow {
  id: string;
  name: string;
  trigger_type: 'pre_due' | 'post_due' | 'manual';
  trigger_days: number | null;
  message_count: number;
  is_default: boolean;
  is_active: boolean;
}

interface PlaybooksTableProps {
  data: PlaybookRow[];
  onDeactivate?: (playbookId: string) => void;
  onDuplicate?: (playbookId: string) => void;
}

/**
 * Formatea los días de trigger para mostrar
 */
function formatTriggerDays(triggerType: string, triggerDays: number | null): string {
  if (triggerType === 'manual') return '-';
  if (triggerDays === null) return '-';

  if (triggerType === 'pre_due') {
    return `${Math.abs(triggerDays)} días antes`;
  }
  return `+${triggerDays} días`;
}

/**
 * Tabla de playbooks con TanStack Table
 */
export function PlaybooksTable({ data, onDeactivate, onDuplicate }: PlaybooksTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Filtrar datos por tipo de trigger
  const filteredData = useMemo(() => {
    if (typeFilter === 'all') return data;
    return data.filter((playbook) => playbook.trigger_type === typeFilter);
  }, [data, typeFilter]);

  const columns: ColumnDef<PlaybookRow>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Nombre',
        cell: ({ row }) => (
          <Link
            href={`/playbooks/${row.original.id}/edit`}
            className="font-medium text-blue-600 hover:underline"
          >
            {row.original.name}
          </Link>
        ),
      },
      {
        accessorKey: 'trigger_type',
        header: 'Tipo',
        cell: ({ row }) => {
          const type = row.original.trigger_type;
          return (
            <span className="text-sm">
              {TRIGGER_TYPE_LABELS[type] || type}
            </span>
          );
        },
      },
      {
        accessorKey: 'trigger_days',
        header: 'Días',
        cell: ({ row }) =>
          formatTriggerDays(row.original.trigger_type, row.original.trigger_days),
      },
      {
        accessorKey: 'message_count',
        header: 'Mensajes',
        cell: ({ row }) => (
          <span className="text-center">{row.original.message_count}</span>
        ),
      },
      {
        accessorKey: 'is_default',
        header: 'Default',
        cell: ({ row }) =>
          row.original.is_default ? (
            <Badge variant="secondary">Default</Badge>
          ) : null,
      },
      {
        accessorKey: 'is_active',
        header: 'Estado',
        cell: ({ row }) => (
          <Badge variant={row.original.is_active ? 'default' : 'outline'}>
            {row.original.is_active ? 'Activo' : 'Inactivo'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: 'Acciones',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Acciones</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/playbooks/${row.original.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </DropdownMenuItem>
              {onDuplicate && (
                <DropdownMenuItem onClick={() => onDuplicate(row.original.id)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicar
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {row.original.is_active && onDeactivate && (
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => onDeactivate(row.original.id)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Desactivar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [onDeactivate, onDuplicate]
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
          placeholder="Buscar por nombre..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="pre_due">Antes del vencimiento</SelectItem>
            <SelectItem value="post_due">Después del vencimiento</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
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
                  No se encontraron playbooks
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className={!row.original.is_active ? 'opacity-50' : ''}>
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
          {table.getFilteredRowModel().rows.length} playbooks
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

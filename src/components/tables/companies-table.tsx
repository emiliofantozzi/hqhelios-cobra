'use client';

/**
 * DataTable de empresas con sorting, filtering y paginación
 *
 * @module components/tables/companies-table
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * Tipo de empresa para la tabla
 */
export interface CompanyRow {
  id: string;
  name: string;
  tax_id: string;
  email: string | null;
  risk_level: 'bajo' | 'medio' | 'alto';
  is_active: boolean;
  invoice_count?: number;
}

interface CompaniesTableProps {
  data: CompanyRow[];
  onDeactivate?: (companyId: string) => void;
}

/**
 * Tabla de empresas con TanStack Table
 */
export function CompaniesTable({ data, onDeactivate }: CompaniesTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');

  // Filtrar datos por riesgo
  const filteredData = useMemo(() => {
    if (riskFilter === 'all') return data;
    return data.filter((company) => company.risk_level === riskFilter);
  }, [data, riskFilter]);

  const columns: ColumnDef<CompanyRow>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Nombre',
        cell: ({ row }) => (
          <Link
            href={`/companies/${row.original.id}`}
            className="font-medium text-blue-600 hover:underline"
          >
            {row.original.name}
          </Link>
        ),
      },
      {
        accessorKey: 'tax_id',
        header: 'Tax ID',
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => row.original.email || '-',
      },
      {
        accessorKey: 'invoice_count',
        header: '# Facturas',
        cell: ({ row }) => (
          <span className="text-center">{row.original.invoice_count ?? 0}</span>
        ),
      },
      {
        accessorKey: 'risk_level',
        header: 'Riesgo',
        cell: ({ row }) => {
          const risk = row.original.risk_level;
          const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            bajo: 'secondary',
            medio: 'default',
            alto: 'destructive',
          };
          return <Badge variant={variants[risk] || 'default'}>{risk}</Badge>;
        },
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
                <Link href={`/companies/${row.original.id}`}>Ver</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/companies/${row.original.id}/edit`}>Editar</Link>
              </DropdownMenuItem>
              {row.original.is_active && onDeactivate && (
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => onDeactivate(row.original.id)}
                >
                  Desactivar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [onDeactivate]
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
          placeholder="Buscar por nombre o Tax ID..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <Select value={riskFilter} onValueChange={setRiskFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por riesgo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los riesgos</SelectItem>
            <SelectItem value="bajo">Bajo</SelectItem>
            <SelectItem value="medio">Medio</SelectItem>
            <SelectItem value="alto">Alto</SelectItem>
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
                  No se encontraron empresas
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
          {table.getFilteredRowModel().rows.length} empresas
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
            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
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

'use client';

/**
 * DataTable de facturas con sorting, filtering y paginación
 *
 * @module components/tables/invoices-table
 */
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
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
import { InvoiceStatusBadge } from '@/components/invoices/invoice-status-badge';
import type { InvoiceStatus } from '@/lib/constants/invoice-status-transitions';

/**
 * Tipo de factura para la tabla
 */
export interface InvoiceRow {
  id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  issue_date: string;
  due_date: string;
  payment_status: string;
  company_id: string;
  company_name: string;
}

interface InvoicesTableProps {
  data: InvoiceRow[];
  /** Si se proporciona, oculta la columna de empresa (para vista embebida en empresa) */
  hideCompanyColumn?: boolean;
}

/**
 * Tabla de facturas con TanStack Table
 */
export function InvoicesTable({ data, hideCompanyColumn = false }: InvoicesTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filtrar datos por estado de pago
  const filteredData = useMemo(() => {
    if (statusFilter === 'all') return data;
    return data.filter((invoice) => invoice.payment_status === statusFilter);
  }, [data, statusFilter]);

  const columns: ColumnDef<InvoiceRow>[] = useMemo(() => {
    const baseColumns: ColumnDef<InvoiceRow>[] = [
      {
        accessorKey: 'invoice_number',
        header: 'Número',
        cell: ({ row }) => (
          <Link
            href={`/invoices/${row.original.id}`}
            className="font-medium text-blue-600 hover:underline"
          >
            {row.original.invoice_number}
          </Link>
        ),
      },
    ];

    // Solo agregar columna de empresa si no está oculta
    if (!hideCompanyColumn) {
      baseColumns.push({
        accessorKey: 'company_name',
        header: 'Empresa',
        cell: ({ row }) => (
          <Link
            href={`/companies/${row.original.company_id}`}
            className="text-gray-900 hover:text-blue-600"
          >
            {row.original.company_name}
          </Link>
        ),
      });
    }

    // Resto de columnas
    baseColumns.push(
      {
        accessorKey: 'amount',
        header: 'Monto',
        cell: ({ row }) => (
          <span>
            {row.original.currency}{' '}
            {Number(row.original.amount).toLocaleString('es-MX', {
              minimumFractionDigits: 2,
            })}
          </span>
        ),
      },
      {
        accessorKey: 'due_date',
        header: 'Vencimiento',
        cell: ({ row }) =>
          format(new Date(row.original.due_date), 'dd MMM yyyy', { locale: es }),
      },
      {
        id: 'situation',
        header: 'Situación',
        cell: ({ row }) => {
          if (row.original.payment_status !== 'pendiente') {
            return <span className="text-sm text-gray-400">-</span>;
          }
          const isOverdue = new Date(row.original.due_date) < new Date();
          return isOverdue ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Vencida
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              A tiempo
            </span>
          );
        },
      },
      {
        accessorKey: 'payment_status',
        header: 'Estado',
        cell: ({ row }) => (
          <InvoiceStatusBadge status={row.original.payment_status as InvoiceStatus} />
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
                <Link href={`/invoices/${row.original.id}`}>Ver</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/invoices/${row.original.id}/edit`}>Editar</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      }
    );

    return baseColumns;
  }, [hideCompanyColumn]);

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
          placeholder="Buscar por número o empresa..."
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
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="fecha_confirmada">Fecha Confirmada</SelectItem>
            <SelectItem value="pagada">Pagada</SelectItem>
            <SelectItem value="escalada">Escalada</SelectItem>
            <SelectItem value="suspendida">Suspendida</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
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
                  No se encontraron facturas
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
          {table.getFilteredRowModel().rows.length} facturas
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

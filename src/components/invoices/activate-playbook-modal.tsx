/**
 * Activate Playbook Modal Component
 * Story 3.5: Activar Playbook en Factura
 *
 * Modal para seleccionar y activar un playbook de cobranza.
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Play, AlertCircle, Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface Playbook {
  id: string;
  name: string;
  description: string | null;
  message_count: number;
}

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
}

interface ActivatePlaybookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  companyId: string;
}

export function ActivatePlaybookModal({
  open,
  onOpenChange,
  invoiceId,
  companyId,
}: ActivatePlaybookModalProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [selectedPlaybook, setSelectedPlaybook] = useState<string | null>(null);
  const [primaryContact, setPrimaryContact] = useState<Contact | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch data cuando se abre el modal
  useEffect(() => {
    if (open) {
      setIsFetching(true);
      setFetchError(null);

      Promise.all([
        fetch('/api/playbooks?includeInactive=false').then((r) => {
          if (!r.ok) throw new Error('Error al cargar playbooks');
          return r.json();
        }),
        fetch(`/api/contacts?companyId=${companyId}`).then((r) => {
          if (!r.ok) throw new Error('Error al cargar contactos');
          return r.json();
        }),
      ])
        .then(([playbooksData, contactsData]) => {
          setPlaybooks(playbooksData);
          // Buscar contacto primario
          const primary = contactsData.find(
            (c: Contact & { is_primary_contact: boolean; is_active: boolean }) =>
              c.is_primary_contact && c.is_active
          );
          setPrimaryContact(primary || null);
          setIsFetching(false);
        })
        .catch((error) => {
          console.error('Error fetching data:', error);
          setFetchError(error.message);
          setIsFetching(false);
        });
    } else {
      // Reset state al cerrar
      setSelectedPlaybook(null);
      setConfirmed(false);
      setFetchError(null);
    }
  }, [open, companyId]);

  const handleActivate = async () => {
    if (!selectedPlaybook) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/activate-playbook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playbookId: selectedPlaybook }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Error al activar playbook');
      }

      toast({
        title: 'Playbook activado',
        description: 'El playbook de cobranza ha sido activado correctamente',
      });

      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al activar playbook',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const canActivate = selectedPlaybook && confirmed && primaryContact;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Activar Playbook de Cobranza</DialogTitle>
        </DialogHeader>

        {isFetching ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : fetchError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{fetchError}</AlertDescription>
          </Alert>
        ) : !primaryContact ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              La empresa no tiene contacto primario definido.{' '}
              <a
                href={`/companies/${companyId}`}
                className="underline font-medium"
              >
                Configurar contacto
              </a>
            </AlertDescription>
          </Alert>
        ) : playbooks.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No hay playbooks activos disponibles.{' '}
              <a href="/playbooks" className="underline font-medium">
                Crear playbook
              </a>
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {/* Playbook Selector */}
            <div>
              <Label className="mb-2 block font-medium">Seleccionar Playbook</Label>
              <RadioGroup
                value={selectedPlaybook || ''}
                onValueChange={setSelectedPlaybook}
              >
                {playbooks.map((pb) => (
                  <div
                    key={pb.id}
                    className="flex items-start space-x-2 p-3 rounded border hover:bg-muted/50 cursor-pointer"
                  >
                    <RadioGroupItem value={pb.id} id={pb.id} className="mt-1" />
                    <Label htmlFor={pb.id} className="flex-1 cursor-pointer">
                      <div className="font-medium">{pb.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {pb.description || 'Sin descripción'} • {pb.message_count}{' '}
                        {pb.message_count === 1 ? 'mensaje' : 'mensajes'}
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Contact Info */}
            <div className="bg-muted p-3 rounded">
              <Label className="text-sm font-medium">Contacto Principal</Label>
              <p className="text-sm mt-1">
                {primaryContact.first_name} {primaryContact.last_name}
              </p>
              <p className="text-sm text-muted-foreground">{primaryContact.email}</p>
              {primaryContact.phone && (
                <p className="text-sm text-muted-foreground">{primaryContact.phone}</p>
              )}
            </div>

            {/* Confirmation Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="confirm"
                checked={confirmed}
                onCheckedChange={(c) => setConfirmed(!!c)}
              />
              <Label htmlFor="confirm" className="text-sm cursor-pointer">
                Confirmo que el contacto es correcto
              </Label>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleActivate}
            disabled={!canActivate || isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            {isLoading ? 'Activando...' : 'Activar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

'use client';

/**
 * ContactsList - Lista de contactos de una empresa
 *
 * @module components/contacts/contacts-list
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreHorizontal, Pencil, UserMinus, Plus, Mail, Phone } from 'lucide-react';
import { ContactForm } from '@/components/forms/contact-form';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  position: string | null;
  is_primary_contact: boolean;
  is_escalation_contact: boolean;
  is_active: boolean;
}

interface ContactsListProps {
  contacts: Contact[];
  companyId: string;
  onRefresh: () => void;
  showInactive?: boolean;
}

export function ContactsList({ contacts, companyId, onRefresh, showInactive = false }: ContactsListProps) {
  const router = useRouter();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deactivatingContact, setDeactivatingContact] = useState<Contact | null>(null);

  // Filtrar contactos según showInactive
  const displayedContacts = showInactive
    ? contacts
    : contacts.filter((c) => c.is_active);

  // Calcular cantidad de contactos primary activos
  const activePrimaryCount = contacts.filter(
    (c) => c.is_primary_contact && c.is_active
  ).length;

  const handleDeactivate = async () => {
    if (!deactivatingContact) return;

    try {
      const response = await fetch(`/api/contacts/${deactivatingContact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: false }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || 'Error al desactivar contacto');
        return;
      }

      setDeactivatingContact(null);
      router.refresh();
      onRefresh();
    } catch (error) {
      console.error('Error deactivating contact:', error);
      alert('Error al desactivar contacto');
    }
  };

  if (displayedContacts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Contactos</CardTitle>
              <CardDescription>
                {showInactive ? 'No hay contactos' : 'No hay contactos registrados para esta empresa'}
              </CardDescription>
            </div>
            {!showInactive && (
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Contacto
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>{showInactive ? 'No hay contactos para mostrar.' : 'Agrega el primer contacto para esta empresa.'}</p>
          </div>
        </CardContent>

        <ContactForm
          mode="create"
          companyId={companyId}
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onSuccess={onRefresh}
        />
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Contactos</CardTitle>
              <CardDescription>
                {displayedContacts.length} contacto{displayedContacts.length !== 1 ? 's' : ''} {showInactive ? '' : 'activo'}
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Contacto
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {displayedContacts.map((contact) => {
              const isOnlyPrimary =
                contact.is_primary_contact && activePrimaryCount === 1;

              return (
              <div
                key={contact.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {contact.first_name} {contact.last_name}
                    </span>
                    {contact.is_primary_contact && (
                      <Badge variant="default" className="bg-green-600">
                        Principal
                        {isOnlyPrimary && ' (Único)'}
                      </Badge>
                    )}
                    {contact.is_escalation_contact && (
                      <Badge variant="secondary" className="bg-orange-500 text-white">
                        Escalamiento
                      </Badge>
                    )}
                    {!contact.is_active && (
                      <Badge variant="outline" className="text-gray-600">
                        Inactivo
                      </Badge>
                    )}
                  </div>
                  {contact.position && (
                    <p className="text-sm text-muted-foreground">
                      {contact.position}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {contact.email}
                    </span>
                    {contact.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {contact.phone}
                      </span>
                    )}
                  </div>
                </div>

                {contact.is_active ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Acciones</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingContact(contact)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => !isOnlyPrimary && setDeactivatingContact(contact)}
                        disabled={isOnlyPrimary}
                        title={isOnlyPrimary ? 'Debe asignar otro contacto principal primero' : ''}
                      >
                        <UserMinus className="mr-2 h-4 w-4" />
                        Desactivar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </div>
            );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add Contact Dialog */}
      <ContactForm
        mode="create"
        companyId={companyId}
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={onRefresh}
      />

      {/* Edit Contact Dialog */}
      {editingContact && (
        <ContactForm
          mode="edit"
          companyId={companyId}
          contactId={editingContact.id}
          initialData={{
            firstName: editingContact.first_name,
            lastName: editingContact.last_name,
            email: editingContact.email,
            phone: editingContact.phone || '',
            position: editingContact.position || '',
            isPrimaryContact: editingContact.is_primary_contact,
            isEscalationContact: editingContact.is_escalation_contact,
          }}
          open={!!editingContact}
          onOpenChange={(open) => !open && setEditingContact(null)}
          onSuccess={onRefresh}
        />
      )}

      {/* Deactivate Confirmation */}
      <AlertDialog
        open={!!deactivatingContact}
        onOpenChange={(open) => !open && setDeactivatingContact(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desactivar contacto</AlertDialogTitle>
            <AlertDialogDescription>
              {deactivatingContact && (
                <>
                  Se desactivará a{' '}
                  <strong>
                    {deactivatingContact.first_name} {deactivatingContact.last_name}
                  </strong>
                  . El contacto no recibirá comunicaciones pero sus datos se conservarán.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

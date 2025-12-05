/**
 * Activate Playbook Button Component
 * Story 3.5: Activar Playbook en Factura
 *
 * Botón para activar un playbook en una factura.
 * Solo visible si factura tiene status válido y no tiene collection activa.
 */
'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ActivatePlaybookModal } from './activate-playbook-modal';

/**
 * Estados de factura válidos para activar un playbook
 */
const VALID_STATUSES = ['pendiente', 'fecha_confirmada'];

interface ActivatePlaybookButtonProps {
  invoiceId: string;
  companyId: string;
  currentStatus: string;
  hasActiveCollection: boolean;
}

/**
 * Botón de activar playbook con tooltip explicativo cuando está disabled
 */
export function ActivatePlaybookButton({
  invoiceId,
  companyId,
  currentStatus,
  hasActiveCollection,
}: ActivatePlaybookButtonProps) {
  const [showModal, setShowModal] = useState(false);

  const isValidStatus = VALID_STATUSES.includes(currentStatus);
  const isDisabled = !isValidStatus || hasActiveCollection;

  // Determinar mensaje del tooltip
  let tooltipMessage = '';
  if (hasActiveCollection) {
    tooltipMessage = 'Esta factura ya tiene un playbook activo';
  } else if (!isValidStatus) {
    tooltipMessage = `Solo se puede activar playbook en facturas pendientes o con fecha confirmada. Estado actual: ${currentStatus}`;
  }

  // Si no debe mostrarse, no renderizar
  if (hasActiveCollection) {
    return null;
  }

  const button = (
    <Button
      variant="outline"
      onClick={() => setShowModal(true)}
      disabled={isDisabled}
    >
      <Play className="mr-2 h-4 w-4" />
      Activar Playbook
    </Button>
  );

  return (
    <>
      {isDisabled && tooltipMessage ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0}>{button}</span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{tooltipMessage}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        button
      )}

      <ActivatePlaybookModal
        open={showModal}
        onOpenChange={setShowModal}
        invoiceId={invoiceId}
        companyId={companyId}
      />
    </>
  );
}

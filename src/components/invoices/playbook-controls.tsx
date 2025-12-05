'use client';

/**
 * Controles de playbook para la vista de factura
 * Story 3.7: Control Manual de Playbook Activo
 *
 * Renderiza botones según el estado actual de la collection:
 * - active: Pausar + Completar
 * - paused: Reanudar + Completar
 * - awaiting_response: Pausar + Completar
 * - pending_review: Completar
 */
import { useState } from 'react';
import { Pause, Play, CheckCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PausePlaybookDialog } from './pause-playbook-dialog';
import { ResumePlaybookDialog } from './resume-playbook-dialog';
import { CompletePlaybookDialog } from './complete-playbook-dialog';

interface PlaybookControlsProps {
  collectionId: string;
  currentStatus: 'active' | 'paused' | 'awaiting_response' | 'pending_review';
  playbookName: string;
  invoiceId: string;
}

export function PlaybookControls({
  currentStatus,
  playbookName,
  invoiceId,
}: PlaybookControlsProps) {
  const [showPause, setShowPause] = useState(false);
  const [showResume, setShowResume] = useState(false);
  const [showComplete, setShowComplete] = useState(false);

  // Determinar qué botones mostrar según estado
  const canPause = currentStatus === 'active' || currentStatus === 'awaiting_response';
  const canResume = currentStatus === 'paused';
  const canComplete = ['active', 'paused', 'awaiting_response', 'pending_review'].includes(
    currentStatus
  );

  return (
    <div className="flex gap-2">
      {canPause && (
        <Button variant="outline" size="sm" onClick={() => setShowPause(true)}>
          <Pause className="mr-2 h-4 w-4" />
          Pausar
        </Button>
      )}

      {canResume && (
        <Button variant="outline" size="sm" onClick={() => setShowResume(true)}>
          <Play className="mr-2 h-4 w-4" />
          Reanudar
        </Button>
      )}

      {canComplete && (
        <Button variant="outline" size="sm" onClick={() => setShowComplete(true)}>
          <CheckCircle className="mr-2 h-4 w-4" />
          Completar
        </Button>
      )}

      <PausePlaybookDialog
        open={showPause}
        onOpenChange={setShowPause}
        invoiceId={invoiceId}
        playbookName={playbookName}
      />
      <ResumePlaybookDialog
        open={showResume}
        onOpenChange={setShowResume}
        invoiceId={invoiceId}
        playbookName={playbookName}
      />
      <CompletePlaybookDialog
        open={showComplete}
        onOpenChange={setShowComplete}
        invoiceId={invoiceId}
        playbookName={playbookName}
      />
    </div>
  );
}

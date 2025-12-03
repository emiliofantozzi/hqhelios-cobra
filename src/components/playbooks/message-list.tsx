'use client';

/**
 * Lista de mensajes con drag & drop para reordenar.
 *
 * @module components/playbooks/message-list
 */
import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableMessageCard, type PlaybookMessageItem } from './sortable-message-card';

interface MessageListProps {
  playbookId: string;
  messages: PlaybookMessageItem[];
  onReorder?: (messages: Array<{ id: string; sequenceOrder: number }>) => Promise<void>;
  onEdit?: (message: PlaybookMessageItem) => void;
  onDelete?: (messageId: string) => void;
  onPreview?: (message: PlaybookMessageItem) => void;
}

/**
 * Lista de mensajes con soporte para reordenar mediante drag & drop.
 *
 * @param props - Propiedades del componente
 * @returns Lista de mensajes sortable
 */
export function MessageList({
  playbookId,
  messages,
  onReorder,
  onEdit,
  onDelete,
  onPreview,
}: MessageListProps) {
  const [items, setItems] = useState(messages);
  const [isReordering, setIsReordering] = useState(false);

  // Sincronizar items cuando cambian los mensajes externos (excepto durante reorder)
  useEffect(() => {
    if (!isReordering) {
      setItems(messages);
    }
  }, [messages, isReordering]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Mínimo 8px de movimiento para iniciar drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  /**
   * Maneja el fin del drag y actualiza el orden
   */
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    // Actualizar orden local inmediatamente (optimistic UI)
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);
    setIsReordering(true);

    // Crear array de nuevo orden
    const newOrder = reordered.map((item, index) => ({
      id: item.id,
      sequenceOrder: index + 1,
    }));

    // Llamar API para persistir
    if (onReorder) {
      try {
        await onReorder(newOrder);
      } catch (error) {
        // Revertir si falla
        console.error('Error reordering messages:', error);
        setItems(messages);
      }
    }

    setIsReordering(false);
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
        <p className="text-lg mb-2">No hay mensajes en este playbook</p>
        <p className="text-sm">Haz clic en "Agregar Mensaje" para crear el primer mensaje de la secuencia.</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map((m) => m.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {items.map((message) => (
            <SortableMessageCard
              key={message.id}
              message={message}
              onEdit={onEdit}
              onDelete={onDelete}
              onPreview={onPreview}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

'use client';

/**
 * Panel de ayuda de variables para templates de mensajes.
 *
 * @module components/playbooks/variable-helper
 */
import { TEMPLATE_VARIABLES, formatVariable } from '@/lib/constants/template-variables';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Copy } from 'lucide-react';

interface VariableHelperProps {
  /** Callback cuando se hace click en una variable */
  onVariableClick?: (variable: string) => void;
  /** Clase CSS adicional para el contenedor */
  className?: string;
}

/**
 * Componente que muestra las variables disponibles para templates.
 * Al hacer click en una variable, ejecuta el callback con la variable formateada.
 *
 * @param props - Propiedades del componente
 * @returns Panel de variables disponibles
 *
 * @example
 * ```tsx
 * <VariableHelper
 *   onVariableClick={(variable) => {
 *     insertAtCursor(textareaRef.current, variable);
 *   }}
 * />
 * ```
 */
export function VariableHelper({ onVariableClick, className = '' }: VariableHelperProps) {
  const handleClick = (key: string) => {
    const formattedVariable = formatVariable(key);
    onVariableClick?.(formattedVariable);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="text-sm font-medium text-gray-700">Variables disponibles</div>
      <p className="text-xs text-gray-500">
        Haz click en una variable para insertarla en el mensaje.
      </p>

      <TooltipProvider>
        <div className="flex flex-wrap gap-2">
          {TEMPLATE_VARIABLES.map((variable) => (
            <Tooltip key={variable.key}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleClick(variable.key)}
                  className="text-xs font-mono h-7"
                >
                  <Copy className="mr-1 h-3 w-3" />
                  {`{{${variable.key}}}`}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-medium">{variable.label}</p>
                  <p className="text-xs text-gray-400">{variable.description}</p>
                  <p className="text-xs">
                    Ejemplo: <span className="font-mono">{variable.example}</span>
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    </div>
  );
}

/**
 * Inserta texto en la posición del cursor de un textarea.
 *
 * @param textarea - Elemento textarea o null
 * @param text - Texto a insertar
 *
 * @example
 * ```tsx
 * const textareaRef = useRef<HTMLTextAreaElement>(null);
 *
 * <VariableHelper
 *   onVariableClick={(variable) => {
 *     insertAtCursor(textareaRef.current, variable);
 *   }}
 * />
 *
 * <textarea ref={textareaRef} />
 * ```
 */
export function insertAtCursor(textarea: HTMLTextAreaElement | null, text: string): void {
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = textarea.value;

  // Insertar texto en la posición del cursor
  textarea.value = value.substring(0, start) + text + value.substring(end);

  // Mover cursor después del texto insertado
  const newPosition = start + text.length;
  textarea.setSelectionRange(newPosition, newPosition);

  // Enfocar el textarea
  textarea.focus();

  // Disparar evento de cambio para react-hook-form
  const event = new Event('input', { bubbles: true });
  textarea.dispatchEvent(event);
}

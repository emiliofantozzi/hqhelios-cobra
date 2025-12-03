/**
 * Variables disponibles para templates de mensajes de cobranza.
 *
 * @remarks
 * Estas variables se reemplazan dinámicamente cuando se envía un mensaje.
 * El formato es {{variable_name}} en los templates.
 */
export const TEMPLATE_VARIABLES = [
  {
    key: 'company_name',
    label: 'Nombre de empresa',
    description: 'Nombre legal de la empresa cliente',
    example: 'Acme Corp',
  },
  {
    key: 'contact_first_name',
    label: 'Nombre del contacto',
    description: 'Primer nombre del contacto principal',
    example: 'Juan',
  },
  {
    key: 'contact_last_name',
    label: 'Apellido del contacto',
    description: 'Apellido del contacto principal',
    example: 'García',
  },
  {
    key: 'invoice_number',
    label: 'Número de factura',
    description: 'Identificador único de la factura',
    example: 'FAC-001',
  },
  {
    key: 'amount',
    label: 'Monto formateado',
    description: 'Monto de la factura con formato de moneda',
    example: '$1,500.00',
  },
  {
    key: 'currency',
    label: 'Moneda',
    description: 'Código de moneda (USD, MXN, etc.)',
    example: 'USD',
  },
  {
    key: 'due_date',
    label: 'Fecha de vencimiento',
    description: 'Fecha de vencimiento de la factura',
    example: '15/01/2025',
  },
  {
    key: 'days_overdue',
    label: 'Días de retraso',
    description: 'Días transcurridos desde el vencimiento',
    example: '7',
  },
  {
    key: 'payment_link',
    label: 'Link de pago',
    description: 'URL para realizar el pago (si está configurado)',
    example: 'https://pay.example.com/inv123',
  },
] as const;

/**
 * Tipo de variable de template.
 */
export type TemplateVariable = (typeof TEMPLATE_VARIABLES)[number];

/**
 * Datos de ejemplo para preview de mensajes.
 *
 * @remarks
 * Estos valores se usan para mostrar cómo se verá el mensaje
 * antes de enviarlo, reemplazando las variables {{...}}.
 */
export const EXAMPLE_DATA: Record<string, string> = {
  company_name: 'Acme Corp',
  contact_first_name: 'Juan',
  contact_last_name: 'García',
  invoice_number: 'FAC-001',
  amount: '$1,500.00',
  currency: 'USD',
  due_date: '15/01/2025',
  days_overdue: '7',
  payment_link: 'https://pay.example.com/inv123',
};

/**
 * Formatea una variable para insertar en un template.
 *
 * @param key - Clave de la variable
 * @returns Variable formateada con llaves dobles, ej: {{company_name}}
 */
export function formatVariable(key: string): string {
  return `{{${key}}}`;
}

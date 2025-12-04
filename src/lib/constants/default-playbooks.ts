/**
 * Playbooks pre-configurados para nuevos tenants.
 *
 * Estos playbooks se crean automáticamente durante el onboarding
 * para que los usuarios puedan empezar a usar el sistema inmediatamente.
 *
 * @module lib/constants/default-playbooks
 */

/**
 * Estructura de un mensaje de playbook por defecto.
 */
export interface DefaultPlaybookMessage {
  channel: 'email' | 'whatsapp';
  temperature: 'amigable' | 'firme' | 'urgente';
  subjectTemplate?: string;
  bodyTemplate: string;
  waitDays: number;
  sendOnlyIfNoResponse: boolean;
}

/**
 * Estructura de un playbook por defecto.
 */
export interface DefaultPlaybook {
  name: string;
  description: string;
  triggerType: 'pre_due' | 'post_due' | 'manual';
  triggerDays: number | null;
  isDefault: boolean;
  messages: DefaultPlaybookMessage[];
}

/**
 * Playbooks pre-configurados en español profesional.
 *
 * Variables disponibles en templates:
 * - {{company_name}} - Nombre de empresa
 * - {{contact_first_name}} - Nombre del contacto
 * - {{invoice_number}} - Número de factura
 * - {{amount}} - Monto formateado
 * - {{currency}} - Moneda
 * - {{due_date}} - Fecha de vencimiento
 * - {{days_overdue}} - Días de retraso
 */
export const DEFAULT_PLAYBOOKS: DefaultPlaybook[] = [
  // ============================================
  // Playbook 1: Recordatorio Pre-Vencimiento
  // ============================================
  {
    name: 'Recordatorio Pre-Vencimiento',
    description: 'Envía un recordatorio amigable 7 días antes del vencimiento de la factura.',
    triggerType: 'pre_due',
    triggerDays: -7,
    isDefault: true,
    messages: [
      {
        channel: 'email',
        temperature: 'amigable',
        subjectTemplate: 'Recordatorio: Factura {{invoice_number}} próxima a vencer',
        bodyTemplate: `Hola {{contact_first_name}},

Te recordamos que la factura {{invoice_number}} por {{amount}} {{currency}} vence el {{due_date}}.

Por favor, realiza el pago a tiempo para evitar cargos adicionales.

Si ya realizaste el pago, por favor ignora este mensaje.

Saludos cordiales,
Equipo de Cobranzas`,
        waitDays: 0,
        sendOnlyIfNoResponse: false,
      },
    ],
  },

  // ============================================
  // Playbook 2: Cobranza Post-Vencimiento
  // ============================================
  {
    name: 'Cobranza Post-Vencimiento',
    description: 'Secuencia de 3 mensajes progresivos después del vencimiento: amigable, firme y urgente.',
    triggerType: 'post_due',
    triggerDays: 3,
    isDefault: true,
    messages: [
      // Mensaje 1: Email amigable (día 0)
      {
        channel: 'email',
        temperature: 'amigable',
        subjectTemplate: 'Factura {{invoice_number}} vencida - Recordatorio de pago',
        bodyTemplate: `Hola {{contact_first_name}},

Esperamos que te encuentres bien. Te escribimos para recordarte que la factura {{invoice_number}} por {{amount}} {{currency}} venció el {{due_date}}.

Entendemos que a veces los pagos pueden retrasarse. Si ya realizaste el pago, por favor háznos saber para actualizar nuestros registros.

Si tienes alguna pregunta sobre la factura o necesitas un plan de pago, estamos aquí para ayudarte.

Saludos cordiales,
Equipo de Cobranzas`,
        waitDays: 0,
        sendOnlyIfNoResponse: false,
      },
      // Mensaje 2: WhatsApp firme (3 días después)
      {
        channel: 'whatsapp',
        temperature: 'firme',
        bodyTemplate: `Hola {{contact_first_name}}, te contactamos de {{company_name}} respecto a la factura {{invoice_number}} que tiene {{days_overdue}} días de retraso por un monto de {{amount}} {{currency}}.

Por favor, contáctanos para resolver esta situación a la brevedad.

¿Puedes confirmar cuándo realizarás el pago?`,
        waitDays: 3,
        sendOnlyIfNoResponse: true,
      },
      // Mensaje 3: Email urgente (3 días después del WhatsApp)
      {
        channel: 'email',
        temperature: 'urgente',
        subjectTemplate: 'URGENTE: Factura {{invoice_number}} - Acción requerida',
        bodyTemplate: `Estimado/a {{contact_first_name}},

La factura {{invoice_number}} por {{amount}} {{currency}} lleva {{days_overdue}} días de retraso sin respuesta de su parte.

Es importante que se comunique con nosotros de inmediato para evitar acciones adicionales de cobranza.

Por favor, realice el pago o contáctenos hoy mismo para discutir opciones de pago.

Atentamente,
Equipo de Cobranzas`,
        waitDays: 3,
        sendOnlyIfNoResponse: true,
      },
    ],
  },

  // ============================================
  // Playbook 3: Escalamiento Manual
  // ============================================
  {
    name: 'Escalamiento',
    description: 'Playbook manual para casos que requieren escalamiento formal.',
    triggerType: 'manual',
    triggerDays: null,
    isDefault: false,
    messages: [
      {
        channel: 'email',
        temperature: 'urgente',
        subjectTemplate: 'Escalamiento: Factura {{invoice_number}} - {{company_name}}',
        bodyTemplate: `Estimado/a {{contact_first_name}},

Este es un aviso formal de escalamiento respecto a la factura {{invoice_number}} por {{amount}} {{currency}} con {{days_overdue}} días de retraso.

Hemos intentado contactarle en múltiples ocasiones sin obtener respuesta. Este caso ha sido escalado a nuestro departamento de recuperación de cartera.

Le solicitamos que se comunique con nosotros de manera urgente para resolver esta situación y evitar que el caso sea referido a instancias legales.

Quedamos a la espera de su pronta respuesta.

Atentamente,
Departamento de Cobranzas`,
        waitDays: 0,
        sendOnlyIfNoResponse: false,
      },
    ],
  },
];

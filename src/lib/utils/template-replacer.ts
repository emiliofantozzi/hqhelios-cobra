/**
 * Utilidades para reemplazo de variables en templates de mensajes.
 *
 * @remarks
 * Las variables usan el formato {{variable_name}}.
 * Variables no encontradas se dejan sin modificar.
 */

/**
 * Reemplaza variables en un template con los valores proporcionados.
 *
 * @param template - Template con variables en formato {{variable}}
 * @param data - Objeto con los valores para reemplazar
 * @returns Template con variables reemplazadas
 *
 * @example
 * ```ts
 * const result = replaceTemplateVariables(
 *   'Hola {{contact_first_name}}, tu factura {{invoice_number}} está vencida.',
 *   { contact_first_name: 'Juan', invoice_number: 'FAC-001' }
 * );
 * // result: 'Hola Juan, tu factura FAC-001 está vencida.'
 * ```
 *
 * @example Variables no encontradas se mantienen
 * ```ts
 * const result = replaceTemplateVariables(
 *   'Hola {{nombre}}, tu saldo es {{saldo}}',
 *   { nombre: 'María' }
 * );
 * // result: 'Hola María, tu saldo es {{saldo}}'
 * ```
 */
export function replaceTemplateVariables(
  template: string,
  data: Record<string, string | number>
): string {
  if (!template) return '';

  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = data[key];
    return value !== undefined && value !== null ? String(value) : match;
  });
}

/**
 * Extrae todas las variables usadas en un template.
 *
 * @param template - Template con variables en formato {{variable}}
 * @returns Array de nombres de variables encontradas (sin duplicados)
 *
 * @example
 * ```ts
 * const vars = extractTemplateVariables(
 *   'Hola {{nombre}}, tu factura {{numero}} por {{monto}} está pendiente.'
 * );
 * // vars: ['nombre', 'numero', 'monto']
 * ```
 */
export function extractTemplateVariables(template: string): string[] {
  if (!template) return [];

  const matches = template.match(/\{\{(\w+)\}\}/g) || [];
  const variables = matches.map((match) => match.replace(/\{\{|\}\}/g, ''));

  // Eliminar duplicados
  return Array.from(new Set(variables));
}

/**
 * Valida si un template tiene variables desconocidas.
 *
 * @param template - Template a validar
 * @param knownVariables - Lista de variables conocidas
 * @returns Array de variables desconocidas encontradas
 *
 * @example
 * ```ts
 * const unknown = validateTemplateVariables(
 *   'Hola {{nombre}}, tu {{variable_desconocida}} es ...',
 *   ['nombre', 'email', 'telefono']
 * );
 * // unknown: ['variable_desconocida']
 * ```
 */
export function validateTemplateVariables(
  template: string,
  knownVariables: string[]
): string[] {
  const usedVariables = extractTemplateVariables(template);
  return usedVariables.filter((v) => !knownVariables.includes(v));
}

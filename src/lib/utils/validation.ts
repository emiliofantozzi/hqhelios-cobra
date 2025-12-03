/**
 * Utilidades de validación centralizadas.
 * Evita duplicación de lógica de validación.
 *
 * @module lib/utils/validation
 */

/**
 * Valida que un string sea un UUID v4 válido.
 *
 * @param uuid - String a validar
 * @returns true si es UUID válido, false en caso contrario
 *
 * @example
 * isValidUUID('123e4567-e89b-12d3-a456-426614174000'); // true
 * isValidUUID('invalid'); // false
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Valida formato de email básico.
 *
 * @param email - Email a validar
 * @returns true si es email válido
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

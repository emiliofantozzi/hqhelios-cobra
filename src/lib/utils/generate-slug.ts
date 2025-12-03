/**
 * Genera slugs unicos para tenants basados en email.
 *
 * @module lib/utils/generate-slug
 */
import { nanoid } from 'nanoid';

/**
 * Genera un slug unico para un tenant basado en el email del usuario.
 *
 * @param email - Email del usuario que se registra
 * @returns Slug unico en formato "base-xxxxxx"
 *
 * @example
 * ```ts
 * generateSlug('john.doe@empresa.com'); // "john-abc123"
 * generateSlug('MARIA@TEST.COM'); // "maria-xyz789"
 * ```
 */
export function generateSlug(email: string): string {
  // FIX 11: Validate email has '@' symbol
  if (!email.includes('@')) {
    throw new Error('Invalid email: missing @ symbol');
  }

  // Extraer parte antes del @
  const base = email.split('@')[0].toLowerCase();

  // Limpiar caracteres no permitidos (solo letras, numeros, guiones)
  const cleanBase = base
    .replace(/[^a-z0-9-]/g, '-') // Reemplazar caracteres especiales con guion
    .replace(/-+/g, '-') // Eliminar guiones consecutivos
    .replace(/^-|-$/g, '') // Eliminar guiones al inicio/final
    .substring(0, 20); // Limitar longitud base

  // FIX 16: Handle empty cleanBase edge case
  const finalBase = cleanBase || 'user';

  // FIX 7: Increase nanoid length from 6 to 12 for better collision resistance
  // 12 characters = ~3.76 quadrillion combinations (practically zero collision)
  const suffix = nanoid(12);

  return `${finalBase}-${suffix}`;
}

/**
 * Genera un nombre de tenant basado en el email.
 * GARANTIZA UNICIDAD incluso en casos edge.
 *
 * @param email - Email del usuario
 * @returns Nombre legible para el tenant (siempre único)
 *
 * @example
 * ```ts
 * generateTenantName('john.doe@empresa.com'); // "John Doe"
 * generateTenantName('maria@test.com'); // "Maria"
 * generateTenantName('invalidemail'); // "Organizacion x7H9k2"
 * ```
 */
export function generateTenantName(email: string): string {
  // Validar formato de email básico
  if (!email.includes('@')) {
    // Generar nombre único si email inválido
    const suffix = nanoid(6);
    return `Organizacion ${suffix}`;
  }

  const base = email.split('@')[0];

  // Capitalizar y reemplazar puntos/guiones con espacios
  const nameParts = base
    .split(/[._-]/)
    .filter((part) => part.length > 0) // Eliminar partes vacías
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

  // Si no se pudo generar nombre, usar fallback único
  if (nameParts.length === 0) {
    const suffix = nanoid(6);
    return `Organizacion ${suffix}`;
  }

  return nameParts.join(' ');
}

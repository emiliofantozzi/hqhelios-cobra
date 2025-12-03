/**
 * Extension de tipos de Clerk para public_metadata
 * @module types/clerk
 */

/**
 * Metadata publica del usuario en Clerk.
 * Incluye tenant_id para aislamiento multi-tenant.
 */
export interface ClerkPublicMetadata {
  tenant_id?: string;
}

/**
 * Extension del modulo @clerk/types para agregar tipos personalizados.
 */
declare global {
  interface UserPublicMetadata {
    tenant_id?: string;
  }
}

export {};

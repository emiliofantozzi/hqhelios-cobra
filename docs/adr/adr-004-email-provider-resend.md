# ADR-004: Email Provider - Resend

## Estado
**ACEPTADO** - 2025-12-05

## Contexto

Para Epic 4 (Comunicación Multicanal) necesitamos un proveedor de email transaccional para enviar notificaciones de cobranza a los clientes.


## Decisión

**Usaremos Resend** como proveedor de email transaccional.

## Razones

1. **Developer Experience superior**
   - API limpia con `{ data, error }` pattern
   - SDK moderno para TypeScript
   - Idempotency keys nativos para retries seguros

2. **Pricing predecible**
   - 3,000 emails/mes gratis (suficiente para MVP)
   - Sin tiers confusos ni overage charges inesperados

3. **Setup rápido**
   - Domain verification en minutos
   - Webhooks configurables desde dashboard

4. **Extensibilidad futura**
   - Soporte nativo para React Email (templates como componentes)
   - Batch sending para escalabilidad

## Consecuencias

### Positivas
- Código más limpio y mantenible
- Menor tiempo de implementación de Story 4.1
- Testing más simple con error handling estructurado

### Negativas
- Ninguna identificada para nuestro caso de uso

## Implementación

### Instalación
```bash
pnpm add resend
```

### Variables de Entorno
```bash
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="cobranzas@tudominio.com"
RESEND_FROM_NAME="Cobranzas - TuEmpresa"
```

### Código de Ejemplo
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ id: string } | { error: string }> {
  const { data, error } = await resend.emails.send({
    from: `${process.env.RESEND_FROM_NAME} <${process.env.RESEND_FROM_EMAIL}>`,
    to,
    subject,
    html,
  });

  if (error) {
    return { error: error.message };
  }

  return { id: data!.id };
}
```

### Webhooks
Endpoint: `POST /api/webhooks/resend`

Eventos a configurar en Resend Dashboard:
- `email.delivered`
- `email.bounced`
- `email.complained`

## Referencias

- [Resend Documentation](https://resend.com/docs)
- [Resend Node SDK](https://github.com/resend/resend-node)
- Epic 4: Story 4.1, Story 4.4

---

**Decisión tomada por:** Winston (Architect), Murat (TEA), John (PM)
**Fecha:** 2025-12-05

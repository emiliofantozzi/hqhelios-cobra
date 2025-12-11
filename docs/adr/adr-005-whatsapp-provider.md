# ADR-005: WhatsApp Provider - Postponed to Epic 5

## Estado
**POSTPONED** - 2025-12-05

## Contexto

Para comunicación multicanal, WhatsApp es un canal importante en México. Sin embargo, la implementación tiene complejidades que no justifican su inclusión en Epic 4.

### Opciones Evaluadas

| Proveedor | Pros | Contras | Costo |
|-----------|------|---------|-------|
| **Twilio** | API estable, sandbox fácil, docs buenos | Más caro que directo | ~$0.005-0.015/msg |
| **WhatsApp Business API (Meta)** | Sin intermediario, costo menor | Requiere aprobación Meta, setup complejo | ~$0.002-0.08/msg |
| **Baileys** (Open Source) | Gratis | Viola TOS, riesgo de ban, sin soporte | $0 |
| **MessageBird** | Alternativa a Twilio | Menos documentación | Similar a Twilio |

## Decisión

**Postponer WhatsApp a Epic 5** y enfocarse en email para Epic 4.

## Razones

1. **Volumen bajo en MVP**
   - ~50 cobranzas activas
   - ~150 mensajes/semana estimados
   - No justifica complejidad de integración WhatsApp aún

2. **Validación de producto primero**
   - Email tiene mayor ROI inmediato
   - Validar core del producto antes de agregar canales

3. **Requerimientos de WhatsApp Business**
   - Número de teléfono dedicado
   - Proceso de aprobación de Meta (días/semanas)
   - Templates pre-aprobados para mensajes de negocio

4. **Reducción de scope Epic 4**
   - Un solo provider = menos integraciones
   - Testing más simple
   - Entrega más rápida

## Plan para Epic 5

### Criterios de Selección de Provider

| Volumen Mensual | Provider Recomendado | Razón |
|-----------------|---------------------|-------|
| < 500 msgs | **Twilio** | Setup rápido, sandbox, sin aprobación inicial |
| 500-5000 msgs | **Evaluar** | Comparar costos Twilio vs Meta |
| > 5000 msgs | **WhatsApp Business API** | Costo por mensaje menor |

### Preparación Requerida (antes de Epic 5)

1. **Obtener número de teléfono dedicado** para WhatsApp Business
2. **Registrar Business en Meta Business Suite**
3. **Definir templates de mensajes** para aprobación
4. **Configurar webhook endpoint** para status updates

### Estimación de Implementación

- Twilio: 1-2 días de desarrollo
- WhatsApp Business API directo: 3-5 días + tiempo de aprobación

## Consecuencias

### Positivas
- Epic 4 más enfocado y entregable más rápido
- Tiempo para preparar requerimientos de WhatsApp
- Validación de producto con email primero

### Negativas
- Algunos clientes prefieren WhatsApp sobre email
- Delay en feature completa de multicanal

### Mitigación
- UI de Epic 4 diseñada para soportar múltiples canales
- Schema `SentMessage.channel` ya soporta 'whatsapp'
- Agregar WhatsApp en Epic 5 será incremental

## Notas Técnicas

### Sobre Baileys (Open Source)
**NO RECOMENDADO para producción:**
- Ingeniería inversa del protocolo WhatsApp
- Viola Terms of Service de WhatsApp
- Riesgo de ban de cuenta
- Sin soporte oficial
- Actualizaciones de WhatsApp pueden romperlo

Solo usar para proyectos personales o testing.

## Referencias

- [Twilio WhatsApp API](https://www.twilio.com/docs/whatsapp)
- [Meta WhatsApp Business Platform](https://developers.facebook.com/docs/whatsapp)
- Epic 5 (pendiente de crear)

---

**Decisión tomada por:** Winston (Architect), Murat (TEA), John (PM), Sally (UX)
**Fecha:** 2025-12-05

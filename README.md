# Portal Uala Bank

Portal interno Procure-to-Pay orientado a segregacion estricta entre Compras, Area Usuaria y AP. El MVP implementa proveedores, ordenes de compra, facturas, trazabilidad, adjuntos y contabilizacion con permisos reales en backend y UI adaptada por rol.

## Stack

- Next.js 16 App Router
- TypeScript
- React 19
- Tailwind CSS 4
- React Hook Form + Zod
- Prisma ORM
- PostgreSQL local
- NextAuth con credenciales
- notificaciones mock tipo outbox para mails futuros
- Vitest
- ESLint + Prettier

## Puertos locales

- App web y backend Next.js: `9000`
- PostgreSQL local del proyecto: `9432`

No se usa Docker ni los puertos `3000` o `8000`.

## Flujo implementado

### Etapa 1 - Compras

- crea proveedores
- crea ordenes de compra
- completa obligatoriamente cuenta contable y CECO
- adjunta archivos a la OC
- aprueba la OC
- ve sus OCs y su estado

### Etapa 2 - Area Usuaria

- ve solo OCs de su propia area
- ve saldo remanente y adjuntos
- puede iniciar una factura desde una OC existente
- recibe facturas derivadas por AP
- completa solo numero de factura, OC y adjunto
- aprueba y envia a AP en un solo paso
- ve historial del expediente

### Etapa 3 - AP

- registra facturas en monitor y las deriva a un area
- ve solo facturas derivadas a AP
- revisa expediente completo
- completa datos contables e importes
- contabiliza
- devuelve al area con comentario obligatorio

## Roles demo

Todos usan la misma contrasena: `Demo1234!`

- `admin@demo.com`
- `compras@demo.com`
- `area@demo.com`
- `ap@demo.com`

## Arquitectura

- `src/app`: paginas protegidas, login y route handlers
- `src/components`: shell corporativo, tablas, formularios y UI reusable
- `src/features`: dominio por modulo con servicios, repositorios y schemas
- `src/lib`: auth, guards, permisos, Prisma, errores, storage local y helpers
- `prisma`: schema, migraciones y seed
- `tests`: tests unitarios e integracion ligera de reglas criticas
- `scripts`: utilidades locales para PostgreSQL

## Modulos

- auth
- users
- roles and permissions
- suppliers
- purchase-orders
- invoices
- accounting
- audit-log
- attachments
- dashboard
- tasks and inbox

## Estados

### PurchaseOrder

- `DRAFT`
- `APPROVED`
- `PARTIALLY_CONSUMED`
- `FULLY_CONSUMED`
- `CLOSED`
- `CANCELED`

### Invoice

- `DRAFT`
- `PENDING_AREA_APPROVAL`
- `REJECTED_BY_AREA`
- `DERIVED_TO_AP`
- `RETURNED_BY_AP`
- `ACCOUNTED`
- `CANCELED`

## Reglas de permisos implementadas

- Solo `PROCUREMENT` puede crear proveedores.
- Solo `PROCUREMENT` puede crear OCs.
- Solo `PROCUREMENT` puede aprobar OCs.
- `REQUESTER_AREA` solo puede ver OCs de su propia area.
- `REQUESTER_AREA` solo puede cargar facturas sobre OCs de su area o gestionar facturas derivadas a su area.
- `REQUESTER_AREA` solo puede enviar facturas a AP en un solo paso.
- `AP` solo ve facturas derivadas a AP en su bandeja y maneja su propio monitor.
- `AP` solo puede contabilizar facturas derivadas.
- `AP` solo puede devolver al area con comentario obligatorio.
- Los menus, botones y acciones visibles cambian por rol.
- El backend bloquea accesos manuales por URL o request fuera de permiso.
- Toda accion critica registra `AuditLog`.

## Reglas de negocio cubiertas

- No permite factura duplicada por `supplierId + invoiceType + invoiceNumber`.
- No permite asociar facturas a OCs fuera de `APPROVED` o `PARTIALLY_CONSUMED`.
- No permite exceder saldo de la OC al contabilizar.
- El proveedor de la factura debe coincidir con el de la OC.
- Rechazos y devoluciones requieren comentario.
- Contabilizar actualiza factura, OC, cuenta contable, CECO y auditoria.
- Los registros criticos usan soft delete o cambio de estado.

## Setup local

### 1. Instalar dependencias

```bash
npm install
```

### 2. Variables de entorno

El proyecto usa:

```env
DATABASE_URL="postgresql://portal:portal@localhost:9432/portal_uala_bank?schema=public"
NEXTAUTH_SECRET="portal-uala-bank-local-secret"
NEXTAUTH_URL="http://localhost:9000"
APP_ENV="local"
UPLOAD_DIR="./storage/uploads"
MAIL_ENABLED="false"
```

### 3. Inicializar PostgreSQL local del proyecto

Requiere PostgreSQL instalado en Windows. El script apunta por defecto a:

`C:\Program Files\PostgreSQL\15\bin`

```bash
npm run db:local:init
npm run db:local:start
npm run db:local:createdb
```

### 4. Aplicar migraciones y seed

```bash
npm run prisma:generate
npx prisma migrate deploy
npm run db:seed
```

### 5. Ejecutar

```bash
npm run dev
```

Abrir [http://localhost:9000/login](http://localhost:9000/login).

## Scripts npm

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run typecheck`
- `npm run test:run`
- `npm run prisma:generate`
- `npm run db:migrate`
- `npm run db:seed`
- `npm run db:local:init`
- `npm run db:local:start`
- `npm run db:local:createdb`
- `npm run db:local:status`
- `npm run db:local:stop`
- `npm run db:migrate:deploy`

## Publicarlo para acceder desde cualquier PC

La forma mas simple de publicarlo es:

1. Frontend y backend Next.js en Vercel
2. Base PostgreSQL en Neon, Supabase o Railway
3. Variables de entorno cargadas en el hosting

### Variables para cloud

```env
DATABASE_URL="postgresql://usuario:password@host/db?sslmode=require"
NEXTAUTH_SECRET="un-secret-largo-y-seguro"
NEXTAUTH_URL="https://tu-dominio-publico"
APP_ENV="production"
UPLOAD_DIR="/tmp/portal-uala-bank-uploads"
MAIL_ENABLED="false"
```

### Pasos recomendados

1. Crear una base PostgreSQL cloud.
2. Ejecutar `npm run db:migrate:deploy` contra esa base.
3. Ejecutar `npm run db:seed` una sola vez para cargar datos demo.
4. Importar el repo de GitHub en Vercel.
5. Configurar las variables de entorno.
6. Desplegar y probar `/login` y `/api/health`.

### Limitacion actual de adjuntos en cloud

En este MVP los adjuntos se guardan en filesystem local. En un deploy serverless eso no es persistente.

Para una version publica estable, la siguiente mejora recomendada es migrar adjuntos a:

- S3
- Cloudflare R2
- Google Cloud Storage
- Vercel Blob

La app ya tiene la capa de storage abstraida en `src/lib/storage.ts`, por lo que esa migracion es directa.

## BAT de arranque

`start-portal.bat`:

- levanta PostgreSQL local
- aplica migraciones
- corre seed
- inicia la app en `9000`
- abre Chrome en `/login`

## Tests incluidos

Se cubren estas reglas:

1. Compras puede crear proveedor
2. Area no puede crear proveedor
3. Compras puede crear OC
4. Area no puede crear OC
5. Area solo ve OCs de su area
6. AP no ve facturas no derivadas
7. AP ve facturas derivadas
8. AP no puede contabilizar si no fue derivada
9. Backend bloquea accesos manuales indebidos
10. Contabilizar actualiza saldo correctamente

Ademas se validan duplicidad de factura, exceso de saldo, comentario obligatorio e invalidacion de transiciones.

## Alcance del MVP

- dashboard con KPIs y accesos rapidos
- CRUD minimo de proveedores
- listado, alta y detalle de OCs
- listado, alta y detalle de facturas
- monitor de facturas para AP
- carga de factura AP separada del monitor
- preview seguro de adjuntos PDF e imagen
- adjuntos locales en OC y factura
- bandejas por rol
- historial y auditoria visible
- contabilizacion con recalculo de saldos
- outbox de notificaciones listo para activar mail real mas adelante

## Limitaciones del MVP

- Sin integracion ERP o contable externa
- Sin notificaciones por mail o mensajeria
- Sin aprobaciones parametrizables multi-step
- Sin paginado server-side avanzado
- Storage de adjuntos solo filesystem local
- Edicion posterior de entidades criticas intencionalmente restringida

## Preparado para fase 2

- storage cloud tipo S3 o GCS
- aprobaciones configurables por monto, area o centro de costo
- integracion con ERP
- notificaciones y SLA
- reportes y exportaciones
- comentarios colaborativos por expediente
- tests e2e

## Estado validado

El objetivo del repo es quedar operativo localmente con:

- migraciones aplicadas
- seed cargado
- login funcional
- permisos y workflow segregados por rol
- auditoria de eventos criticos
- app compilando sin errores

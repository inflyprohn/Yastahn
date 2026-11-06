# Yasta — Menús, Pedidos y Cobros para Cafeterías en Honduras 🇭🇳

**Yasta** es una aplicación web full-stack responsive (móvil, tableta y escritorio) diseñada para que cafeterías, comedores y negocios de comida preparada en Honduras gestionen menús, pedidos para recoger en barra, clientes, cobros en efectivo y transferencias, saldos acumulados de **"pago a fin de mes"**, códigos QR permanentes y soporte al cliente.

> ⚠️ **Estado del prototipo:** Esta versión es un **prototipo funcional de demostración**. Utiliza autenticación simulada y almacenamiento local en el navegador (`localStorage`) con datos ficticios. **No está conectada a servicios externos reales** (ni bancos, ni pasarelas de pago, ni SMS, ni WhatsApp) y **no debe utilizarse con contraseñas, números de teléfono o información financiera real**.

---

## 1. Credenciales de Demostración (Ficticias)

Utilice estas cuentas de prueba para evaluar los tres roles del sistema:

| Rol | Nombre | Identificador / Celular | Contraseña / PIN | Contexto de prueba |
| :--- | :--- | :--- | :--- | :--- |
| **Cliente** | Carlos Mejía | `+504 9555-1234` | PIN: `1234` | Cliente recurrente de **Café Copán** (tiene crédito a fin de mes activo, debe L 285.00) y de **Comedor Doña Suyapa** (sin crédito a fin de mes, saldo L 0.00). Permite verificar el aislamiento de cuentas. |
| **Cliente** | Kenia Aguilar | `+504 9444-5678` | PIN: `5678` | Cliente con pedidos en efectivo pendientes de pago al recoger en barra. |
| **Dueño** | Doña Elena Romero | `dueno@yasta.hn` | `Copan2026!` | Administra dos negocios (**Café Copán Artesanal** y **Baleadas El Progreso**). Permite probar el selector multi-negocio, cambio de estados de pedidos, cobros, categorías dinámicas y afiches QR. |
| **Superadmin** | Lic. Roberto Paz | `admin@yasta.hn` | `YastaSuper2026!` | Acceso privado global. Puede suspender/reactivar locales, gestionar la bandeja global de tickets de soporte y consultar el log de auditoría. |

### PINs de Fidelidad para Acceso a Menús (Vista de Cliente)

Para acceder a ver el menú y ordenar en cada cafetería, el cliente debe ingresar el PIN de fidelidad del local:
- **Café Copán Artesanal:** `2026`
- **Comedor Doña Suyapa:** `1234`
- **Baleadas El Progreso:** `7777`

*(El prototipo incluye un botón de autocompletado en pantalla para facilitar la prueba inmediata, y los dueños pueden cambiar su PIN en cualquier momento desde su panel).*

*Nota: También dispone de una barra superior ("Probar como...") para alternar entre roles con un solo clic.*

---

## 2. Rutas Principales

- `/` — Página inicial con catálogo de negocios de comida en Honduras, llamada a la acción y accesos rápidos por rol.
- `/c/:slug` — Menú protegido por PIN de fidelidad y toma de pedidos de una cafetería específica (ej. `/c/cafe-copan`, `/c/comedor-suyapa`).
- `/cliente/ingresar` y `/cliente/registro` — Acceso y registro público de clientes con celular hondureño (+504) y PIN de 4 dígitos.
- `/cliente` — Portal privado del cliente: pedidos activos, historial y **cuentas separadas por cafetería**.
- `/dueno/ingresar` y `/dueno` — Pantalla de acceso y panel de administración del dueño (pedidos, categorías dinámicas, catálogo con fotos, PIN del local, clientes, libro contable y afiche QR).
- `/superadmin/ingresar` y `/superadmin` — Acceso restringido y panel de control de plataforma (supervisión de negocios, tickets globales y bitácora de auditoría).
- `/soporte` — Bandeja y creación de casos de soporte con categorización hondureña y chat bidireccional.

---

## 3. Flujos y Funciones Implementadas

1. **Gestión Personalizada de Categorías (Panel del Dueño):**
   - El dueño puede **crear, renombrar y eliminar categorías** adaptadas a su oferta gastronómica (ej. *Bebidas Calientes*, *Desayunos Típicos*, *Almuerzos Ejecutivos*, *Postres Caseros*).
   - **Edición en cascada:** al modificar el nombre de una categoría, todos los platillos asociados se actualizan automáticamente.
   - **Eliminación segura:** si una categoría contiene productos, el sistema solicita confirmación y reasigna los productos a la categoría principal para evitar que queden huérfanos.
   - Pestaña de filtrado ágil con contador de platillos por categoría.

2. **Acceso al Menú con PIN Único de Fidelidad (Vista de Cliente):**
   - Para ver los platillos, precios y ordenar en `/c/:slug`, el cliente debe ingresar un **PIN de 4 dígitos** proporcionado por el dueño del local.
   - Mecanismo diseñado para fidelidad de clientes habituales, comensales de empresas cercanas y consumo exclusivo en el local.
   - El dueño puede configurar o actualizar su PIN en cualquier momento desde su panel ("Menú y Platillos → PIN de Fidelidad").
   - El PIN se imprime automáticamente en el **afiche de mesa / QR** descargable.
   - La sesión del navegador recuerda el desbloqueo (`sessionStorage`), permitiendo al usuario navegar con comodidad y volver a bloquear si lo desea.
   - Los dueños y superadministradores tienen acceso directo al menú de sus locales sin requerir el PIN.

3. **Catálogo y Pedidos para Recoger:**
   - Precios expresados estrictamente en Lempiras hondureños (`Intl.NumberFormat("es-HN", { style: "currency", currency: "HNL" })`).
   - **Fotos de platillos y previsualización ampliada (Lightbox):** cada ítem del menú puede incluir su fotografía. El cliente puede hacer clic sobre el plato para abrir un modal de vista previa en alta resolución con ingredientes detallados, precio en HNL y añadirlo directamente a su pedido.
   - **Gestión de fotos en el panel de dueño:** el encargado puede subir fotos desde su dispositivo (JPG, PNG, WebP de hasta 2 MB) o elegir entre muestras típicas hondureñas (Baleada Especial, Desayuno Típico, Pollo Chuco, Café Pour-Over).
   - Carrito de compras con selector de cantidades y notas de preparación.
   - Indicador de platillos "Agotado hoy" que deshabilita la compra.
   - Estimación de tiempo para recoger en el local. No hay entregas a domicilio.
   - Congelamiento inmutable: cada pedido almacena una copia exacta de los nombres y precios al momento de la compra.

2. **Métodos de Pago y Libro Contable:**
   - **Efectivo:** el pedido se registra con cobro pendiente hasta que el dueño pulsa "Registrar efectivo recibido".
   - **Transferencia bancaria:** queda pendiente de verificación hasta que el encargado introduce o valida el número de referencia (+504).
   - **Pago a fin de mes (cuenta de confianza):** solo seleccionable si el dueño habilitó previamente el crédito para ese cliente en su negocio. Incrementa el saldo adeudado del cliente.
   - El dueño puede registrar abonos (parciales o totales) y ajustes contables con **motivo obligatorio para auditoría**. No se pueden borrar movimientos financieros.

3. **Aislamiento Multi-Tenant entre Negocios:**
   - Un mismo cliente (ej. Carlos Mejía) puede pedir en Café Copán y en Comedor Doña Suyapa. Sus pedidos, saldos y notas permanecen 100% aislados por local.
   - La dueña Elena Romero no puede ver los clientes ni la contabilidad de Don Mario Villeda.

4. **Códigos QR Reales para Mesas y Mostrador:**
   - Generación vectorial en `<canvas>` utilizando la biblioteca `qrcode` (nivel de corrección de errores 'H').
   - El enlace apunta directamente a `/c/:slug`.
   - Botón para copiar enlace permanente.
   - Botón para descargar archivo PNG en alta resolución.
   - Botón para **"Imprimir afiche de mesa"**: plantilla maquetada lista para recortar y colocar en barras o mesas.

5. **Fotos de Perfil y Logos:**
   - Soporte para cliente, dueño y superadministrador.
   - Modal con vista previa circular y recorte centrado.
   - Iniciales tipográficas como avatar predeterminado si no se sube foto.
   - Validación estricta en cliente: rechaza archivos SVG o no-imagen, y restringe el tamaño a un máximo de 2 MB.

6. **Soporte Tipo Casos:**
   - Categorías: Problema con un pedido, Problema con un pago o saldo, Problema para ingresar, Error de la plataforma, Otra consulta.
   - Hilo de mensajes bidireccional con estados: `nuevo`, `en_atencion`, `resuelto`.
   - Superadministrador y dueños pueden responder y cambiar el estado.

7. **Superadministración y Auditoría:**
   - Suspensión y reactivación inmediata de cafeterías.
   - Registro inmutable de acciones administrativas (quién, cuándo, acción y descripción).

---

## 4. Configuración de Dominio Propio para Códigos QR

Para que los códigos QR generados tengan un enlace definitivo con su propio dominio web (ej. `https://yasta.hn/c/cafe-copan`), configure la siguiente variable en su archivo `.env`:

```env
VITE_PUBLIC_APP_URL="https://midominio.com"
```

Si no se define esta variable, la aplicación utilizará automáticamente `window.location.origin` (la URL actual de la vista previa).

---

## 5. Requisitos y Seguridad antes de Pasar a Producción (Checklist OWASP ASVS)

Para convertir este prototipo demostrativo en un sistema listo para producción con datos reales, deben implementarse las siguientes medidas en el servidor:

1. **Autenticación Fuerte:**
   - Implementar hash de contraseñas con **Argon2id** (o scrypt/bcrypt con costo adecuado) y salt criptográfico único por usuario. Prohibir hashes rápidos (MD5, SHA-256 simple).
   - Sustituir el PIN de 4 dígitos como factor único remoto por verificación SMS de un solo uso (OTP con caducidad de 5 minutos y límite de 3 intentos), o autenticación WebAuthn / Passkeys.
   - Manejo de sesiones mediante cookies `HttpOnly`, `Secure`, `SameSite=Lax/Strict`. Nunca guardar tokens de autenticación en `localStorage`.

2. **Control de Acceso y Autorización en Servidor (RBAC & Row-Level Security):**
   - Validar permisos en cada solicitud API (`/api/orders`, `/api/ledger`, `/api/business`).
   - Aplicar políticas de seguridad por fila (RLS) en la base de datos para garantizar que el `businessId` consultado coincida con los negocios autorizados del usuario.
   - No confiar en identificadores (`userId`, `cafeId`) enviados por el cliente sin verificar el token de sesión.

3. **Cifrado y Protección de Datos:**
   - Cifrado en tránsito (HTTPS obligatorio con HSTS).
   - Cifrado en reposo para bases de datos (AES-256) y copias de seguridad automáticas programadas.

4. **Validación de Archivos en el Servidor:**
   - Inspeccionar los "números mágicos" (magic bytes) de las imágenes subidas para garantizar que sean realmente JPEG, PNG o WebP.
   - Eliminar metadatos EXIF (que puedan contener coordenadas GPS o información personal) antes de almacenar la imagen en un bucket privado con URLs prefirmadas.

5. **Protección contra Inyecciones y Abuso:**
   - Consultas preparadas / parametrizadas (ORM como Drizzle o Prisma).
   - Rate limiting (limitación de tasa) en rutas de login y envío de pedidos para mitigar ataques de fuerza bruta o saturación.

---

## 6. Ejecución Local

Para ejecutar el proyecto en su máquina local:

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo en el puerto 3000
npm run dev

# 3. Compilar para producción
npm run build
```

# Campestre Grill House

Sitio en React y Vite. Ejecuta `npm install` y `npm run dev` para abrirlo localmente.

## Reservaciones por correo

El formulario envía la solicitud a `/api/reservations`. En Vercel, ese archivo se despliega como función del servidor. La clave del servicio nunca se incluye en el JavaScript del navegador.

Para activar el envío real:

1. Crea una cuenta en [Resend](https://resend.com/) y verifica un dominio desde el que puedas enviar correo.
2. Configura estas variables de entorno en el proyecto de Vercel (o en un archivo `.env.local` para probar localmente). Usa [.env.example](.env.example) como guía:
   - `RESEND_API_KEY`: clave privada de Resend.
   - `RESERVATION_FROM_EMAIL`: dirección del dominio verificado, por ejemplo `reservas@tu-dominio.com`.
   - `RESERVATION_TO_EMAIL`: buzón que recibirá las solicitudes.
3. Despliega de nuevo el proyecto después de guardar las variables.

El formulario solicita el correo del cliente y lo agrega como dirección de respuesta. Una solicitud enviada aún requiere confirmación del restaurante. Sin las variables configuradas, la página muestra un mensaje para reservar por teléfono.

const json = (body, status = 200) => Response.json(body, {
  status,
  headers: { 'Cache-Control': 'no-store' },
});

const validEmail = value => typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;

export async function POST(request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return json({ error: 'Solicitud no permitida.' }, 403);

  let data;
  try {
    const raw = await request.text();
    if (raw.length > 5000) return json({ error: 'La solicitud es demasiado larga.' }, 413);
    data = JSON.parse(raw);
  } catch {
    return json({ error: 'Datos de reserva inválidos.' }, 400);
  }

  if (!data || typeof data !== 'object') return json({ error: 'Datos de reserva inválidos.' }, 400);
  if (data.website) return json({ ok: true }); // Hidden spam trap.

  const nombre = typeof data.nombre === 'string' ? data.nombre.trim() : '';
  const email = typeof data.email === 'string' ? data.email.trim() : '';
  const fecha = typeof data.fecha === 'string' ? data.fecha : '';
  const hora = typeof data.hora === 'string' ? data.hora : '';
  const personas = Number(data.personas);
  const nota = typeof data.nota === 'string' ? data.nota.trim() : '';

  if (nombre.length < 2 || nombre.length > 100 || !validEmail(email) || nota.length > 1000 || !Number.isInteger(personas) || personas < 1 || personas > 12) {
    return json({ error: 'Revisa tu nombre, correo y cantidad de personas.' }, 400);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !/^([0-1]\d|2[0-3]):(00|30)$/.test(hora)) {
    return json({ error: 'Selecciona una fecha y hora válidas.' }, 400);
  }
  const date = new Date(`${fecha}T12:00:00-06:00`);
  const localToday = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guatemala', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== fecha || fecha < localToday || hora < '07:00' || hora > '19:30') {
    return json({ error: 'La fecha y hora deben estar dentro del horario disponible.' }, 400);
  }

  const { RESEND_API_KEY, RESERVATION_FROM_EMAIL, RESERVATION_TO_EMAIL } = process.env;
  if (!RESEND_API_KEY || !validEmail(RESERVATION_FROM_EMAIL) || !validEmail(RESERVATION_TO_EMAIL)) {
    return json({ error: 'Las reservas por correo aún no están configuradas. Llámanos para reservar.' }, 503);
  }

  const text = [
    'Nueva solicitud de reservación — Campestre Grill House',
    '',
    `Nombre: ${nombre}`,
    `Correo para responder: ${email}`,
    `Fecha: ${fecha}`,
    `Hora: ${hora}`,
    `Personas: ${personas}`,
    `Comentarios: ${nota || 'Ninguno'}`,
    '',
    'La mesa aún no está confirmada. Responde al cliente para confirmarla.',
  ].join('\n');

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Campestre Grill House <${RESERVATION_FROM_EMAIL}>`,
        to: [RESERVATION_TO_EMAIL],
        reply_to: email,
        subject: `Solicitud de reserva · ${fecha} ${hora} · ${nombre}`,
        text,
      }),
    });
    if (!response.ok) {
      console.error('Resend rejected reservation email:', response.status);
      return json({ error: 'No se pudo enviar la solicitud. Llámanos para reservar.' }, 502);
    }
    return json({ ok: true });
  } catch (error) {
    console.error('Reservation email failed:', error);
    return json({ error: 'No se pudo enviar la solicitud. Llámanos para reservar.' }, 502);
  }
}

export function GET() {
  return json({ error: 'Método no permitido.' }, 405);
}

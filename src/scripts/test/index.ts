// Flujo completo: turno (cantidad → ambientes → reunión → confirmación) y test de estilo
// (intro → estilos → colores → sensaciones → materiales → carga → moodboard).
import { ESTUDIO, whatsappUrl } from '../../data/estudio';
import { COLLAGE_ALTO, FRASES_CARGA, TIPOS, TITULOS, buscar, celdasDe, esColor, esFoto, esSensacion, piezasDe, type Picks, type Tipo } from '../../data/test';
import {
  desdeIso,
  emailValido,
  fechaLarga,
  fechaTitulo,
  mensajeAlEstudio,
  mensajeConfirmacion,
  normalizarTelefono,
  telefonoLegible,
} from '../mensajes';
import { $, $$, avisar, guardado, reducido } from '../ui';
import { DEMO, ErrorApi, WHATSAPP_AUTO, disponibilidad, enviarTest, iso, miTurno, reservar, subirFotos, type Disponibilidad } from './api';
import { historia } from './historia';

const datos = JSON.parse($('#datos-test').textContent || '{}') as {
  fotos: { estilos: Record<string, string>; materiales: Record<string, string> };
  sitio: string;
};

const PASOS = ['cantidad', 'ambientes', 'reunion', 'confirmada', 'intro', 'estilos', 'colores', 'sensaciones', 'materiales', 'carga', 'resultado'] as const;
type Paso = (typeof PASOS)[number];
const ANTERIOR: Partial<Record<Paso, Paso>> = {
  ambientes: 'cantidad', reunion: 'ambientes', intro: 'confirmada',
  estilos: 'intro', colores: 'estilos', sensaciones: 'colores', materiales: 'sensaciones', carga: 'materiales', resultado: 'materiales',
};
const SUGERENCIAS = ['Living', 'Comedor', 'Cocina', 'Dormitorio', 'Baño', 'Home office', 'Cuarto infantil', 'Balcón'];
const CLAVE = 'viogua-turno-v2';
const indice = (p: Paso) => PASOS.indexOf(p);
const esTurno = (p: Paso) => indice(p) <= indice('reunion');
const esTest = (p: Paso) => indice(p) >= indice('intro');

interface Estado {
  paso: Paso;
  cantidad: number | null;
  ambientes: string[];
  reunion: { fecha: string; hora: string | null } | null;
  cliente: { nombre: string; email: string; tel: string; consentimiento: boolean };
  confirmada: boolean;
  token: string | null;
  mensaje: string | null;
  meetUrl: string | null;
  picks: Picks;
  testEnviado: boolean;
}
const nuevo = (): Estado => ({
  paso: 'cantidad', cantidad: null, ambientes: [], reunion: null,
  cliente: { nombre: '', email: '', tel: '', consentimiento: false },
  confirmada: false, token: null, mensaje: null, meetUrl: null,
  picks: { estilos: [], colores: [], sensaciones: [], materiales: [] }, testEnviado: false,
});

const guardadoPrevio = guardado.leer(CLAVE);
let estado: Estado = (() => {
  try {
    const leido = JSON.parse(guardadoPrevio ?? 'null');
    return leido && leido.picks ? { ...nuevo(), ...leido, cliente: { ...nuevo().cliente, ...leido.cliente } } : nuevo();
  } catch {
    return nuevo();
  }
})();
const guardar = () => guardado.escribir(CLAVE, JSON.stringify(estado));
const fotos: ({ blob: Blob; url: string; nombre: string } | undefined)[] = []; // solo en memoria

/** El test se habilita con el turno confirmado (con backend, con el token de la reserva). */
const habilitado = () => (DEMO ? estado.confirmada : Boolean(estado.token));
const testUrl = (token: string | null) => `${datos.sitio}test/${token ? `?t=${encodeURIComponent(token)}` : ''}`;

/* ---------- Navegación entre pasos ---------- */
const secciones = $$<HTMLElement>('.paso-test');
const seccion = (p: Paso) => secciones.find(s => s.dataset.paso === p)!;
const preparar: Partial<Record<Paso, () => void | boolean>> = {};
let primeraVez = true;

function destinoValido(paso: Paso): Paso {
  if (esTest(paso) && !habilitado()) return 'cantidad';
  if (esTurno(paso) && estado.confirmada) return 'confirmada'; // ya reservó: no se reserva dos veces
  return paso;
}

function mostrar(paso: Paso, foco: boolean) {
  if (estado.paso === 'carga' && paso !== 'carga') limpiarCarga();
  estado.paso = paso;
  guardar();
  secciones.forEach(s => { s.hidden = s.dataset.paso !== paso; });
  preparar[paso]?.();
  pintarProgreso();
  window.scrollTo({ top: 0, behavior: 'instant' });
  if (foco) $('h2', seccion(paso))?.focus({ preventScroll: true });
}

function ir(destino: Paso, { foco = true }: { foco?: boolean } = {}) {
  const paso = destinoValido(destino);
  const desde = estado.paso;
  const animar = !primeraVez && !reducido() && 'startViewTransition' in document && paso !== desde;
  primeraVez = false;
  if (!animar) return mostrar(paso, foco);

  document.documentElement.dataset.direccion = indice(paso) >= indice(desde) ? 'adelante' : 'atras';
  const compartidas = desde === 'carga' && paso === 'resultado';
  if (compartidas) nombrarCeldas(true);
  const t = document.startViewTransition(() => {
    if (compartidas) nombrarCeldas(false);
    mostrar(paso, foco);
    if (compartidas) nombrarPiezas(true);
  });
  t.ready.catch(() => {}); // si se salta (otra transición empezó antes), no es un error
  t.finished.catch(() => {}).finally(() => {
    delete document.documentElement.dataset.direccion;
    if (compartidas) nombrarPiezas(false);
  });
}

function pintarProgreso() {
  const p = estado.paso;
  const i = indice(p);
  $('#test-contador').textContent =
    i < 4 ? `Turno · ${i + 1} de 4`
    : p === 'intro' ? 'Test de estilo'
    : i <= 8 ? `Test · ${i - 4} de 4`
    : p === 'carga' ? 'Armando tu moodboard' : 'Tu moodboard';
  const avance: Record<string, number> = {
    turno: i < 4 ? ((i + 1) / 4) * 100 : 100,
    test: i < 4 ? 0 : Math.min(100, ((i - 4) / 5) * 100 + 10),
    resultado: p === 'resultado' ? 100 : 0,
  };
  $$<HTMLElement>('#tramos li').forEach(li => {
    const t = li.dataset.tramo!;
    li.style.setProperty('--avance', `${avance[t]}%`);
    li.toggleAttribute('data-activo', (t === 'turno' && i < 4) || (t === 'test' && i >= 4 && i < 10) || (t === 'resultado' && i === 10));
    li.toggleAttribute('data-bloqueado', t === 'test' && !habilitado());
  });
}

$$<HTMLButtonElement>('[data-siguiente]').forEach(b => b.addEventListener('click', () => {
  if (b.getAttribute('aria-disabled') === 'true') return avisarFaltan(b.dataset.requiere as Tipo);
  ir(b.dataset.siguiente as Paso);
}));
$('#test-volver').addEventListener('click', () => {
  const anterior = ANTERIOR[estado.paso];
  if (estado.paso === 'cantidad' || estado.paso === 'confirmada' || !anterior) location.href = '/';
  else ir(anterior);
});

// Reiniciar pide un segundo toque en lugar de un confirm().
const botonReiniciar = $<HTMLButtonElement>('#test-reiniciar');
let reiniciarTiempo: ReturnType<typeof setTimeout>;
botonReiniciar.addEventListener('click', () => {
  if (botonReiniciar.dataset.armado !== 'si') {
    botonReiniciar.dataset.armado = 'si';
    botonReiniciar.textContent = '¿Seguro? Tocá de nuevo';
    reiniciarTiempo = setTimeout(() => { delete botonReiniciar.dataset.armado; botonReiniciar.textContent = 'Empezar de nuevo'; }, 3500);
    return;
  }
  clearTimeout(reiniciarTiempo);
  delete botonReiniciar.dataset.armado;
  botonReiniciar.textContent = 'Empezar de nuevo';
  estado = nuevo();
  fotos.forEach(f => f && URL.revokeObjectURL(f.url));
  fotos.length = 0;
  guardar();
  ir('cantidad');
});

/* ---------- 1. Cantidad ---------- */
const radios = $$<HTMLInputElement>('input[name="cantidad"]');
function ajustarAmbientes() {
  const n = estado.cantidad === 4 ? 5 : estado.cantidad ?? 0;
  estado.ambientes = Array.from({ length: n }, (_, i) => estado.ambientes[i] || '');
}
radios.forEach(r => r.addEventListener('change', () => {
  estado.cantidad = Number(r.value);
  ajustarAmbientes();
  guardar();
  $('#error-cantidad').textContent = '';
}));
preparar.cantidad = () => {
  radios.forEach(r => { r.checked = Number(r.value) === estado.cantidad; });
};
$('#cantidad-siguiente').addEventListener('click', () => {
  if (!estado.cantidad) {
    $('#error-cantidad').textContent = 'Elegí cuántos ambientes querés diseñar.';
    radios[0].focus();
    return;
  }
  ir('ambientes');
});

/* ---------- 2. Ambientes ---------- */
// Las fotos se achican en el navegador (≤ 1600 px) antes de guardarlas o subirlas.
async function achicar(archivo: File): Promise<Blob> {
  const MAX = 1600;
  const bitmap = await createImageBitmap(archivo);
  const k = Math.min(1, MAX / Math.max(bitmap.width, bitmap.height));
  if (k === 1 && archivo.size < 1_500_000) return archivo;
  const lienzo = document.createElement('canvas');
  lienzo.width = Math.round(bitmap.width * k);
  lienzo.height = Math.round(bitmap.height * k);
  lienzo.getContext('2d')!.drawImage(bitmap, 0, 0, lienzo.width, lienzo.height);
  return new Promise((ok, mal) => lienzo.toBlob(b => (b ? ok(b) : mal(new Error('sin imagen'))), 'image/jpeg', 0.85));
}

preparar.ambientes = () => {
  if (!estado.cantidad) return ir('cantidad');
  const lista = $('#lista-ambientes');
  const plantilla = $<HTMLTemplateElement>('#plantilla-ambiente');
  lista.textContent = '';
  $('#error-ambientes').textContent = '';
  estado.ambientes.forEach((nombre, i) => {
    const caja = plantilla.content.firstElementChild!.cloneNode(true) as HTMLElement;
    const etiqueta = $<HTMLLabelElement>('.ambiente-cabeza label', caja);
    const campo = $<HTMLInputElement>('input.campo', caja);
    campo.id = `ambiente-${i}`;
    etiqueta.htmlFor = campo.id;
    etiqueta.textContent = `Ambiente ${i + 1}`;
    if (estado.cantidad === 4 && i === 4) etiqueta.insertAdjacentHTML('afterend', '<span class="regalo">De regalo</span>');
    campo.value = nombre;

    const chips = $('.chips', caja);
    SUGERENCIAS.forEach(s => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.textContent = s;
      chip.setAttribute('aria-pressed', String(campo.value === s));
      chip.addEventListener('click', () => {
        campo.value = s;
        campo.dispatchEvent(new Event('input'));
      });
      chips.appendChild(chip);
    });
    const marcarChips = () => $$('.chip', chips).forEach(c => c.setAttribute('aria-pressed', String(c.textContent === campo.value.trim())));
    campo.addEventListener('input', () => {
      estado.ambientes[i] = campo.value.trim();
      campo.removeAttribute('aria-invalid');
      marcarChips();
      guardar();
    });

    const zona = $('.foto', caja);
    const archivo = $<HTMLInputElement>('input[type="file"]', zona);
    archivo.id = `foto-${i}`;
    $<HTMLLabelElement>('.foto-boton', zona).htmlFor = archivo.id;
    const vista = $<HTMLImageElement>('.foto-vista', zona);
    const rotulo = $('.foto-boton span', zona);
    const ayuda = $('.foto-ayuda', zona);
    const quitar = $<HTMLButtonElement>('.foto-quitar', zona);
    const mostrarFoto = () => {
      const f = fotos[i];
      vista.hidden = !f;
      quitar.hidden = !f;
      ayuda.hidden = Boolean(f);
      rotulo.textContent = f ? 'Cambiar foto' : 'Agregar foto';
      if (f) {
        vista.src = f.url;
        vista.alt = `Foto de ${estado.ambientes[i] || `ambiente ${i + 1}`}`;
      }
    };
    const usar = async (f: File | undefined) => {
      if (!f) return;
      if (!f.type.startsWith('image/')) return avisar('Ese archivo no es una imagen.');
      try {
        const blob = await achicar(f);
        if (fotos[i]) URL.revokeObjectURL(fotos[i]!.url);
        fotos[i] = { blob, url: URL.createObjectURL(blob), nombre: f.name };
        mostrarFoto();
      } catch {
        avisar('No pudimos leer esa foto. Probá con otra.');
      }
    };
    archivo.addEventListener('change', () => usar(archivo.files?.[0]));
    quitar.addEventListener('click', () => {
      if (fotos[i]) URL.revokeObjectURL(fotos[i]!.url);
      fotos[i] = undefined;
      archivo.value = '';
      mostrarFoto();
    });
    zona.addEventListener('dragover', e => { e.preventDefault(); zona.setAttribute('data-encima', ''); });
    zona.addEventListener('dragleave', () => zona.removeAttribute('data-encima'));
    zona.addEventListener('drop', e => {
      e.preventDefault();
      zona.removeAttribute('data-encima');
      usar(e.dataTransfer?.files[0]);
    });
    mostrarFoto();
    lista.appendChild(caja);
  });
};
$('#ambientes-siguiente').addEventListener('click', () => {
  const vacios = $$<HTMLInputElement>('#lista-ambientes input.campo').filter(c => !c.value.trim());
  vacios.forEach(c => c.setAttribute('aria-invalid', 'true'));
  if (vacios.length) {
    $('#error-ambientes').textContent = vacios.length === 1 ? 'Falta el nombre de un ambiente.' : `Faltan los nombres de ${vacios.length} ambientes.`;
    vacios[0].focus();
    return;
  }
  ir('reunion');
});

/* ---------- 3. Reunión ---------- */
const hoy = new Date();
hoy.setHours(0, 0, 0, 0);
const fmtMes = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' });
let mesVisto = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
const cache = new Map<string, Disponibilidad>();
const claveMes = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;
let errorAgenda = '';

async function cargarMes(mes: Date, forzar = false) {
  const clave = claveMes(mes);
  if (cache.has(clave) && !forzar) return;
  const desde = iso(new Date(mes.getFullYear(), mes.getMonth(), 1));
  const hasta = iso(new Date(mes.getFullYear(), mes.getMonth() + 1, 0));
  $('#calendario-grilla').setAttribute('aria-busy', 'true');
  try {
    cache.set(clave, await disponibilidad(desde, hasta));
    errorAgenda = '';
  } catch (e) {
    errorAgenda = e instanceof ErrorApi ? e.message : 'No pudimos cargar la agenda.';
  } finally {
    if (claveMes(mesVisto) === clave) $('#calendario-grilla').removeAttribute('aria-busy');
  }
}
const diaDe = (fecha: string) => {
  const d = new Date(`${fecha}T12:00:00`);
  return cache.get(claveMes(d))?.[fecha] ?? [];
};

function pintarCalendario() {
  const mes = fmtMes.format(mesVisto);
  $('#calendario-mes').textContent = mes.charAt(0).toUpperCase() + mes.slice(1);
  const minimo = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const maximo = new Date(hoy.getFullYear(), hoy.getMonth() + 2, 1);
  $<HTMLButtonElement>('#mes-anterior').disabled = mesVisto <= minimo;
  $<HTMLButtonElement>('#mes-siguiente').disabled = mesVisto >= maximo;
  const grilla = $('#calendario-grilla');
  grilla.textContent = '';
  const a = mesVisto.getFullYear(), m = mesVisto.getMonth();
  const desplazamiento = (new Date(a, m, 1).getDay() + 6) % 7;
  for (let k = 0; k < desplazamiento; k++) grilla.appendChild(document.createElement('span'));
  const dias = new Date(a, m + 1, 0).getDate();
  const disp = cache.get(claveMes(mesVisto));
  for (let d = 1; d <= dias; d++) {
    const fecha = new Date(a, m, d);
    const f = iso(fecha);
    const libres = disp?.[f]?.some(h => h.libre) ?? false;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'dia' + (fecha.getTime() === hoy.getTime() ? ' dia--hoy' : '');
    b.textContent = String(d);
    b.disabled = !libres;
    b.setAttribute('aria-label', fechaLarga(desdeIso(f)) + (libres ? '' : ', sin turnos'));
    b.setAttribute('aria-pressed', String(estado.reunion?.fecha === f));
    b.addEventListener('click', () => {
      estado.reunion = { fecha: f, hora: null };
      guardar();
      pintarCalendario();
      pintarHorarios();
      $('#error-reunion').textContent = '';
      $('#horarios button:not(:disabled)')?.focus();
    });
    grilla.appendChild(b);
  }
}

function pintarHorarios() {
  const caja = $('#horarios');
  caja.textContent = '';
  if (errorAgenda) {
    $('#horarios-titulo').textContent = 'Agenda';
    caja.innerHTML = `<p class="horarios-vacio"></p><button type="button" class="enlace">Reintentar</button>`;
    $('.horarios-vacio', caja).textContent = errorAgenda;
    $('button', caja).addEventListener('click', async () => { await cargarMes(mesVisto, true); pintarCalendario(); pintarHorarios(); });
    return;
  }
  if (!estado.reunion) {
    $('#horarios-titulo').textContent = 'Elegí un día';
    caja.innerHTML = '<p class="horarios-vacio">Los días con horarios libres están habilitados en el calendario.</p>';
    return;
  }
  $('#horarios-titulo').textContent = `Horarios del ${fechaLarga(desdeIso(estado.reunion.fecha))}`;
  diaDe(estado.reunion.fecha).forEach((h, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'horario';
    b.style.setProperty('--i', String(i));
    b.textContent = h.hora;
    b.disabled = !h.libre;
    if (!h.libre) b.setAttribute('aria-label', `${h.hora}, ocupado`);
    b.setAttribute('aria-pressed', String(estado.reunion!.hora === h.hora));
    b.addEventListener('click', () => {
      estado.reunion!.hora = h.hora;
      guardar();
      pintarHorarios();
      $('#error-reunion').textContent = '';
      $<HTMLButtonElement>(`#horarios .horario[aria-pressed="true"]`)?.focus();
    });
    caja.appendChild(b);
  });
}

async function verMes(mes: Date) {
  mesVisto = mes;
  pintarCalendario();
  await cargarMes(mes);
  if (claveMes(mesVisto) === claveMes(mes)) { pintarCalendario(); pintarHorarios(); }
}
$('#mes-anterior').addEventListener('click', () => verMes(new Date(mesVisto.getFullYear(), mesVisto.getMonth() - 1, 1)));
$('#mes-siguiente').addEventListener('click', () => verMes(new Date(mesVisto.getFullYear(), mesVisto.getMonth() + 1, 1)));

// Campos con validación al salir de cada uno.
const campos = {
  nombre: $<HTMLInputElement>('#cliente-nombre'),
  email: $<HTMLInputElement>('#cliente-email'),
  tel: $<HTMLInputElement>('#cliente-tel'),
  consentimiento: $<HTMLInputElement>('#cliente-consentimiento'),
  web: $<HTMLInputElement>('#cliente-web'),
};
type Campo = 'nombre' | 'email' | 'tel' | 'consentimiento';
const validar: Record<Campo, () => string> = {
  nombre: () => (campos.nombre.value.trim().length < 2 ? 'Escribí tu nombre.' : ''),
  email: () => (!campos.email.value.trim() ? 'Escribí tu email.' : !emailValido(campos.email.value) ? 'Revisá tu email: parece incompleto.' : ''),
  tel: () => (!campos.tel.value.trim() ? 'Escribí tu WhatsApp.' : !normalizarTelefono(campos.tel.value) ? 'Revisá tu WhatsApp: código de área sin 0 y número sin 15.' : ''),
  consentimiento: () => (campos.consentimiento.checked ? '' : 'Necesitamos tu OK para usar estos datos.'),
};
const errorCampo = (c: Campo) => $(`#error-${c === 'tel' ? 'tel' : c}`);
function revisar(c: Campo) {
  const msj = validar[c]();
  errorCampo(c).textContent = msj;
  if (msj) campos[c].setAttribute('aria-invalid', 'true');
  else campos[c].removeAttribute('aria-invalid');
  return !msj;
}
(['nombre', 'email', 'tel'] as const).forEach(c => {
  campos[c].addEventListener('input', () => {
    estado.cliente[c] = campos[c].value.trim();
    if (campos[c].hasAttribute('aria-invalid')) revisar(c);
    guardar();
  });
  campos[c].addEventListener('blur', () => { if (campos[c].value.trim()) revisar(c); });
});
campos.consentimiento.addEventListener('change', () => {
  estado.cliente.consentimiento = campos.consentimiento.checked;
  revisar('consentimiento');
  guardar();
});

preparar.reunion = () => {
  if (!estado.ambientes.length || estado.ambientes.some(a => !a)) return ir('ambientes');
  campos.nombre.value = estado.cliente.nombre;
  campos.email.value = estado.cliente.email;
  campos.tel.value = estado.cliente.tel;
  campos.consentimiento.checked = estado.cliente.consentimiento;
  $('#error-reunion').textContent = '';
  if (estado.reunion) {
    const f = new Date(`${estado.reunion.fecha}T12:00:00`);
    if (f <= hoy) estado.reunion = null;
    else mesVisto = new Date(f.getFullYear(), f.getMonth(), 1);
  }
  verMes(mesVisto).then(() => {
    // Si el horario guardado ya no está libre, se descarta.
    if (estado.reunion && !diaDe(estado.reunion.fecha).some(h => h.libre && (!estado.reunion!.hora || h.hora === estado.reunion!.hora))) {
      estado.reunion = null;
      pintarCalendario();
      pintarHorarios();
    }
  });
  pintarHorarios();
};

const botonConfirmar = $<HTMLButtonElement>('#confirmar-reunion');
$<HTMLFormElement>('#form-reunion').addEventListener('submit', async e => {
  e.preventDefault();
  const error = $('#error-reunion');
  if (!estado.reunion?.hora) {
    error.textContent = 'Elegí un día y un horario.';
    ($('#horarios button:not(:disabled)') ?? $('.dia:not(:disabled)'))?.focus();
    return;
  }
  const invalidos = (['nombre', 'email', 'tel', 'consentimiento'] as const).filter(c => !revisar(c));
  if (invalidos.length) {
    error.textContent = invalidos.length === 1 ? 'Revisá el dato marcado.' : 'Revisá los datos marcados.';
    campos[invalidos[0]].focus();
    return;
  }
  error.textContent = '';
  const textoBoton = botonConfirmar.textContent;
  botonConfirmar.setAttribute('data-ocupado', '');
  botonConfirmar.textContent = 'Confirmando…';
  try {
    const r = await reservar(
      {
        nombre: estado.cliente.nombre,
        email: estado.cliente.email,
        whatsapp: normalizarTelefono(estado.cliente.tel)!,
        cantidad: estado.cantidad!,
        ambientes: estado.ambientes,
        fecha: estado.reunion.fecha,
        hora: estado.reunion.hora,
        consentimiento: estado.cliente.consentimiento,
        web: campos.web.value,
      },
      testUrl
    );
    Object.assign(estado, { confirmada: true, token: r.token, mensaje: r.mensaje, meetUrl: r.meetUrl });
    guardar();
    if (r.token) {
      const conFoto = fotos.flatMap((f, i) => (f ? [{ blob: f.blob, nombre: f.nombre, ambiente: estado.ambientes[i] }] : []));
      subirFotos(r.token, conFoto).catch(() => avisar('Tu turno quedó confirmado, pero no pudimos subir las fotos.'));
    }
    ir('confirmada');
  } catch (err) {
    if (err instanceof ErrorApi && err.estado === 409) {
      error.textContent = 'Ese horario se acaba de ocupar. Elegí otro, por favor.';
      estado.reunion.hora = null;
      await cargarMes(mesVisto, true);
      pintarCalendario();
      pintarHorarios();
    } else error.textContent = err instanceof ErrorApi ? err.message : 'No pudimos confirmar la reunión. Probá de nuevo.';
  } finally {
    botonConfirmar.removeAttribute('data-ocupado');
    botonConfirmar.textContent = textoBoton;
  }
});

/* ---------- 4. Confirmación ---------- */
preparar.confirmada = () => {
  if (!estado.confirmada || !estado.reunion?.hora) return ir('cantidad');
  const fecha = desdeIso(estado.reunion.fecha);
  $('#turno-dia').textContent = fechaTitulo(fecha);
  $('#turno-hora').textContent = `${estado.reunion.hora} hs`;
  const lista = $('#turno-ambientes');
  lista.textContent = '';
  estado.ambientes.forEach(a => { const li = document.createElement('li'); li.textContent = a; lista.appendChild(li); });

  const mensaje = estado.mensaje ?? mensajeConfirmacion({
    nombre: estado.cliente.nombre, fecha, hora: estado.reunion.hora, ambientes: estado.ambientes, meetUrl: estado.meetUrl, testUrl: testUrl(estado.token),
  });
  $('#wa-mensaje').textContent = mensaje;
  const tel = normalizarTelefono(estado.cliente.tel);
  $('#wa-estado').textContent = WHATSAPP_AUTO && tel ? `Te enviamos este mensaje por WhatsApp al ${telefonoLegible(tel)}` : 'Así queda tu confirmación';
  const alEstudio = whatsappUrl(mensajeAlEstudio({ nombre: estado.cliente.nombre, fecha, hora: estado.reunion.hora }));
  const confirmar = $<HTMLAnchorElement>('#wa-confirmar');
  confirmar.hidden = WHATSAPP_AUTO || !alEstudio;
  if (alEstudio) confirmar.href = alEstudio;
  $('#confirmacion-email').textContent = DEMO
    ? `Modo demo: no se envía nada. Con la agenda conectada, la invitación con el link de Google Meet llega a ${estado.cliente.email}.`
    : `Te mandamos la invitación con el link de Google Meet a ${estado.cliente.email}. Si no la ves, revisá el correo no deseado.`;
};

/* ---------- Test: grillas de selección ---------- */
function pintarSeleccion(tipo: Tipo) {
  const lista = estado.picks[tipo];
  $$<HTMLButtonElement>(`[data-grilla="${tipo}"] .opcion`).forEach(b => {
    const n = lista.indexOf(b.dataset.id!);
    b.setAttribute('aria-pressed', String(n >= 0));
    $('.opcion-orden', b).textContent = n >= 0 ? String(n + 1) : '';
  });
  $(`[data-cuenta="${tipo}"]`).innerHTML = `<b>${lista.length}</b> de 4 elegidos`;
  const siguiente = $<HTMLButtonElement>(`[data-requiere="${tipo}"]`);
  const completo = lista.length === 4;
  siguiente.setAttribute('aria-disabled', String(!completo));
  siguiente.classList.toggle('listo', completo);
}
function avisarFaltan(tipo: Tipo) {
  const faltan = 4 - estado.picks[tipo].length;
  avisar(faltan === 1 ? 'Te falta elegir 1.' : `Te faltan elegir ${faltan}.`);
}

function alternar(tipo: Tipo, id: string, boton: HTMLElement) {
  const lista = estado.picks[tipo];
  const n = lista.indexOf(id);
  if (n >= 0) lista.splice(n, 1);
  else if (lista.length >= 4) {
    boton.classList.remove('lleno');
    void boton.offsetWidth;
    boton.classList.add('lleno');
    avisar('Ya elegiste 4. Tocá uno de los elegidos para cambiarlo.');
    return;
  } else {
    lista.push(id);
    if (navigator.userActivation?.isActive) navigator.vibrate?.(8);
  }
  estado.testEnviado = false;
  guardar();
  pintarSeleccion(tipo);
}

TIPOS.forEach(tipo => {
  const grilla = $(`[data-grilla="${tipo}"]`);
  grilla.addEventListener('click', e => {
    const b = (e.target as Element).closest<HTMLElement>('.opcion');
    if (b) alternar(tipo, b.dataset.id!, b);
  });
  preparar[tipo] = () => pintarSeleccion(tipo);
});
const completos = () => TIPOS.every(t => estado.picks[t].length === 4);

/* ---------- Carga ---------- */
let tiempos: ReturnType<typeof setTimeout>[] = [];
let intervalo: ReturnType<typeof setInterval> | undefined;
function limpiarCarga() {
  tiempos.forEach(clearTimeout);
  tiempos = [];
  clearInterval(intervalo);
}
const mezclar = <T,>(lista: T[]) => lista.map(v => [Math.random(), v] as const).sort((a, b) => a[0] - b[0]).map(p => p[1]);
const fotoDe = (tipo: Tipo, id: string) => (tipo === 'estilos' || tipo === 'materiales' ? datos.fotos[tipo][id] : '');

preparar.carga = () => {
  limpiarCarga();
  if (!completos()) return ir('materiales');
  const grilla = $('#carga-grilla');
  grilla.innerHTML = '<span></span>'.repeat(16);
  const spans = [...grilla.children] as HTMLElement[];
  const usados: Record<Tipo, number> = { estilos: 0, colores: 0, sensaciones: 0, materiales: 0 };
  celdasDe(estado.picks).forEach(({ tipo, item }, k) => {
    const s = spans[k];
    s.dataset.vt = `vt-${tipo}-${usados[tipo]++}`;
    if (!item) return;
    if (esFoto(tipo)) s.style.backgroundImage = `url("${fotoDe(tipo, item.id)}")`;
    else if (esColor(item)) s.style.backgroundColor = item.hex;
    else s.style.backgroundColor = 'var(--rosa)';
  });
  const total = reducido() ? 2400 : 6400;
  mezclar([...spans.keys()]).forEach((k, n) => {
    tiempos.push(setTimeout(() => spans[k].classList.add('puesto'), 250 + (n * (total - 1200)) / 16));
  });
  const frases = mezclar(FRASES_CARGA);
  const frase = $('#carga-frase');
  let j = 0;
  frase.textContent = frases[0];
  frase.removeAttribute('data-cambiando');
  intervalo = setInterval(() => {
    frase.setAttribute('data-cambiando', '');
    tiempos.push(setTimeout(() => { j = (j + 1) % frases.length; frase.textContent = frases[j]; frase.removeAttribute('data-cambiando'); }, 350));
  }, reducido() ? 1100 : 1600);
  tiempos.push(setTimeout(() => ir('resultado'), total));
};

// Las 16 muestras viajan de la grilla de carga a su lugar en el collage.
function nombrarCeldas(si: boolean) {
  $$<HTMLElement>('#carga-grilla span').forEach(s => { s.style.viewTransitionName = si ? s.dataset.vt! : ''; });
}
function nombrarPiezas(si: boolean) {
  $$<HTMLElement>('#collage-resultado .pieza').forEach(p => { p.style.viewTransitionName = si ? p.dataset.vt! : ''; });
}

/* ---------- Resultado ---------- */
function collage(contenedor: HTMLElement, picks: Picks) {
  contenedor.textContent = '';
  piezasDe(picks).forEach((p, i) => {
    const { item } = p;
    const el = document.createElement('figure');
    el.className = `pieza pieza--${p.forma}`;
    el.dataset.vt = `vt-${p.tipo}-${p.n}`;
    el.style.cssText = `left:${p.x}%;top:${(p.y / COLLAGE_ALTO) * 100}%;width:${p.w}%;height:${(p.h / COLLAGE_ALTO) * 100}%;--i:${i}`;
    if (esFoto(p.tipo)) {
      el.classList.add('pieza--foto');
      const img = document.createElement('img');
      img.src = fotoDe(p.tipo, item.id);
      img.alt = `${p.tipo === 'estilos' ? 'Estilo' : 'Material'} ${item.nombre}`;
      img.decoding = 'async';
      const chip = document.createElement('figcaption');
      chip.className = 'pieza-chip';
      chip.textContent = item.nombre;
      el.append(img, chip);
    } else if (esColor(item)) {
      el.classList.add('pieza--color');
      el.style.backgroundColor = item.hex;
      el.setAttribute('role', 'img');
      el.setAttribute('aria-label', `Color ${item.nombre}`);
    } else if (esSensacion(item)) {
      el.classList.add('pieza--frase', p.fondo === 'rosa' ? 'pieza--rosa' : 'pieza--blanca');
      const frase = document.createElement('p');
      frase.textContent = item.frase;
      const nombre = document.createElement('span');
      nombre.textContent = item.nombre;
      el.append(frase, nombre);
    }
    contenedor.appendChild(el);
  });
}

preparar.resultado = () => {
  if (!completos()) return ir('estilos');
  collage($('#collage-resultado'), estado.picks);
  const leyenda = $('#leyenda');
  leyenda.textContent = '';
  TIPOS.forEach((t, n) => {
    const grupo = document.createElement('div');
    grupo.className = 'leyenda-grupo';
    grupo.innerHTML = `<h3><span class="leyenda-numero">0${n + 1}</span><span></span></h3><ul></ul>`;
    $('h3 span:last-child', grupo).textContent = TITULOS[t];
    estado.picks[t].forEach(id => {
      const item = buscar(t, id);
      if (!item) return;
      const li = document.createElement('li');
      if (esColor(item)) {
        const punto = document.createElement('span');
        punto.className = 'leyenda-punto';
        punto.style.setProperty('--c', item.hex);
        li.appendChild(punto);
      }
      li.append(item.nombre);
      $('ul', grupo).appendChild(li);
    });
    leyenda.appendChild(grupo);
  });
  // Con backend: el estudio recibe las elecciones y la imagen antes de la reunión (una sola vez).
  if (estado.token && !estado.testEnviado) {
    historia(estado.picks, datos.fotos)
      .then(png => enviarTest(estado.token!, estado.picks, png))
      .then(() => { estado.testEnviado = true; guardar(); })
      .catch(() => { /* se reintenta la próxima vez que vea el resultado */ });
  }
};

$('#repetir-test').addEventListener('click', () => {
  estado.picks = { estilos: [], colores: [], sensaciones: [], materiales: [] };
  estado.testEnviado = false;
  ir('estilos');
});

/* ---------- Guardar, ver y compartir la imagen (1080 × 1920) ---------- */
const dialogo = $<HTMLDialogElement>('#dialogo-imagen');
let urlDialogo: string | null = null;
function mostrarImagen(blob: Blob) {
  if (urlDialogo) URL.revokeObjectURL(urlDialogo);
  urlDialogo = URL.createObjectURL(blob);
  $<HTMLImageElement>('#dialogo-img').src = urlDialogo;
  dialogo.showModal();
}
$('#cerrar-dialogo').addEventListener('click', () => dialogo.close());
dialogo.addEventListener('click', e => { if (e.target === dialogo) dialogo.close(); });

async function conBoton(boton: HTMLButtonElement, tarea: () => Promise<void>) {
  boton.setAttribute('data-ocupado', '');
  try {
    await tarea();
  } catch (e) {
    if ((e as Error)?.name !== 'AbortError') avisar('No se pudo armar la imagen. Probá de nuevo.');
  } finally {
    boton.removeAttribute('data-ocupado');
  }
}
const ARCHIVO = 'moodboard-viogua.png';

$<HTMLButtonElement>('#guardar-moodboard').addEventListener('click', e => conBoton(e.currentTarget as HTMLButtonElement, async () => {
  const blob = await historia(estado.picks, datos.fotos);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = ARCHIVO;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  avisar(`Descargando ${ARCHIVO}`);
}));
$<HTMLButtonElement>('#ver-imagen').addEventListener('click', e => conBoton(e.currentTarget as HTMLButtonElement, async () => {
  mostrarImagen(await historia(estado.picks, datos.fotos));
}));

// Compartir directo a Instagram o WhatsApp en el celular (Web Share API con archivo).
const botonCompartir = $<HTMLButtonElement>('#compartir-moodboard');
const prueba = typeof File === 'function' ? new File([''], ARCHIVO, { type: 'image/png' }) : null;
if (prueba && navigator.canShare?.({ files: [prueba] })) {
  botonCompartir.hidden = false;
  $<HTMLButtonElement>('#guardar-moodboard').classList.add('boton--linea');
  botonCompartir.addEventListener('click', () => conBoton(botonCompartir, async () => {
    const blob = await historia(estado.picks, datos.fotos);
    const archivo = new File([blob], ARCHIVO, { type: 'image/png' });
    await navigator.share({ files: [archivo], title: `Mi moodboard ${ESTUDIO.nombre}`, text: `Mi estilo, mi mundo. Hice el test de estilo de @${ESTUDIO.instagram}.` });
  }));
}

/* ---------- Entrada ---------- */
(async () => {
  const params = new URLSearchParams(location.search);
  const token = params.get('t');
  // Retomar el test desde otro dispositivo con el link del mensaje (con backend).
  if (token && !DEMO && token !== estado.token) {
    try {
      const t = await miTurno(token);
      const [fecha, hora] = t.inicio.slice(0, 16).split('T');
      estado = { ...nuevo(), paso: 'intro', confirmada: true, token, meetUrl: t.meetUrl, ambientes: t.ambientes, reunion: { fecha, hora },
        cliente: { ...nuevo().cliente, nombre: t.nombre }, picks: t.picks ?? nuevo().picks, testEnviado: Boolean(t.picks) };
      guardar();
    } catch {
      avisar('No encontramos ese turno. Si ya agendaste, escribinos y lo resolvemos.');
    }
  }
  if (params.has('promo') && !estado.confirmada) {
    estado.cantidad = 4;
    ajustarAmbientes();
    estado.paso = 'cantidad';
  }
  if (params.size) history.replaceState(null, '', location.pathname);

  let paso: Paso = PASOS.includes(estado.paso) ? estado.paso : 'cantidad';
  if (paso === 'carga') paso = completos() ? 'resultado' : 'materiales';
  const retoma = guardadoPrevio && paso !== 'cantidad' && paso !== 'resultado' && !token;
  ir(paso, { foco: false });
  if (retoma) avisar('Retomaste donde lo dejaste.');
})();

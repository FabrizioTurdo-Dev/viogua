import { describe, expect, it } from 'vitest';
import {
  desdeIso,
  emailValido,
  fechaLarga,
  fechaTitulo,
  lista,
  mensajeAlEstudio,
  mensajeConfirmacion,
  normalizarTelefono,
  telefonoLegible,
} from '../src/scripts/mensajes';

describe('fechas', () => {
  it('escribe la fecha larga sin coma', () => {
    expect(fechaLarga(desdeIso('2026-10-13'))).toBe('martes 13 de octubre');
  });
  it('capitaliza el título del turno', () => {
    expect(fechaTitulo(desdeIso('2026-10-13'))).toBe('Martes 13 de octubre');
  });
  it('no corre el día por la zona horaria', () => {
    expect(fechaLarga(desdeIso('2026-12-31'))).toBe('jueves 31 de diciembre');
  });
});

describe('lista', () => {
  it('une con «y»', () => {
    expect(lista(['Living'])).toBe('Living');
    expect(lista(['Living', 'Dormitorio principal'])).toBe('Living y Dormitorio principal');
    expect(lista(['Living', 'Cocina', 'Baño'])).toBe('Living, Cocina y Baño');
  });
  it('ignora vacíos y espacios', () => {
    expect(lista([' Living ', '', 'Cocina'])).toBe('Living y Cocina');
  });
});

describe('normalizarTelefono', () => {
  it.each([
    ['11 2345 6789', '5491123456789'],
    ['011 15 2345-6789', '5491123456789'],
    ['11 15 2345 6789', '5491123456789'],
    ['+54 9 11 2345 6789', '5491123456789'],
    ['54 11 2345 6789', '5491123456789'],
    ['0351 15 123 4567', '5493511234567'],
    ['351 1234567', '5493511234567'],
    ['2944 15 12 3456', '5492944123456'],
    ['0054 9 11 2345 6789', '5491123456789'],
  ])('%s → %s', (entrada, salida) => {
    expect(normalizarTelefono(entrada)).toBe(salida);
  });
  it('respeta números de otros países con +', () => {
    expect(normalizarTelefono('+56 9 7863 2055')).toBe('56978632055');
  });
  it('rechaza lo que no se puede interpretar', () => {
    expect(normalizarTelefono('1234')).toBeNull();
    expect(normalizarTelefono('')).toBeNull();
    expect(normalizarTelefono('hola')).toBeNull();
  });
  it('lo muestra legible', () => {
    expect(telefonoLegible('5491123456789')).toBe('+54 9 11 2345-6789');
    expect(telefonoLegible('5493511234567')).toBe('+54 9 351 123-4567');
  });
});

describe('emailValido', () => {
  it('acepta y rechaza', () => {
    expect(emailValido('sofia@gmail.com')).toBe(true);
    expect(emailValido(' sofia@estudio.com.ar ')).toBe(true);
    expect(emailValido('sofia@gmail')).toBe(false);
    expect(emailValido('sofia gmail.com')).toBe(false);
  });
});

describe('mensajeConfirmacion', () => {
  const base = {
    nombre: 'Sofía',
    fecha: desdeIso('2026-10-13'),
    hora: '15:00',
    ambientes: ['Living', 'Dormitorio principal'],
    testUrl: 'https://viogua.vercel.app/test/',
  };
  it('arma el texto validado', () => {
    expect(mensajeConfirmacion({ ...base, meetUrl: 'https://meet.google.com/abc-defg-hij' })).toBe(
      [
        '¡Hola, Sofía! Te escribimos de VioGua.',
        '',
        'Tu reunión quedó confirmada:',
        '• Día: martes 13 de octubre',
        '• Hora: 15:00 hs (hora de Argentina)',
        '• Videollamada por Google Meet: https://meet.google.com/abc-defg-hij',
        '',
        'Vamos a conversar sobre: Living y Dormitorio principal.',
        '',
        'Si querés, antes de la reunión hacé el test de estilo y te regalamos tu moodboard: https://viogua.vercel.app/test/',
        '',
        '¿Necesitás cambiar el horario? Respondé este mensaje y lo reprogramamos.',
        '¡Te esperamos!',
      ].join('\n')
    );
  });
  it('sin link de Meet avisa que llega por email', () => {
    expect(mensajeConfirmacion(base)).toContain('• Videollamada por Google Meet (el link te llega por email)');
  });
  it('no menciona Zoom', () => {
    expect(mensajeConfirmacion(base)).not.toMatch(/zoom/i);
  });
  it('el mensaje al estudio lleva día y hora', () => {
    expect(mensajeAlEstudio(base)).toBe(
      '¡Hola! Soy Sofía. Acabo de agendar una reunión con VioGua para el martes 13 de octubre a las 15:00 hs.'
    );
  });
});

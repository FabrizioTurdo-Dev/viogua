-- Turnos de VioGua: reservas, test de estilo, fotos de los ambientes y accesos al panel del estudio.
-- Todo con RLS y sin políticas: solo las Edge Functions (service role) leen y escriben.

create table public.reservas (
  id uuid primary key default gen_random_uuid(),
  -- Va en el link del test y de la ficha (?t=...): retomar desde otro dispositivo y ver el pedido.
  token uuid not null unique default gen_random_uuid(),
  -- pendiente: pedido por WhatsApp, VioGua lo confirma a mano. confirmada: con fecha firme (a mano o
  -- por Google Calendar). Las dos retienen el horario; cancelada lo libera.
  estado text not null default 'pendiente' check (estado in ('pendiente', 'confirmada', 'cancelada')),
  nombre text not null check (char_length(nombre) between 2 and 80),
  email text not null check (char_length(email) between 5 and 120),
  whatsapp text not null check (whatsapp ~ '^[0-9]{8,15}$'),
  cantidad smallint not null check (cantidad between 1 and 4),
  ambientes text[] not null check (cardinality(ambientes) between 1 and 5),
  inicio timestamptz not null,
  fin timestamptz not null check (fin > inicio),
  google_event_id text,
  meet_url text check (meet_url is null or meet_url ~ '^https://'),
  consentimiento boolean not null check (consentimiento),
  creada timestamptz not null default now()
);
comment on table public.reservas is 'Turnos pedidos desde el sitio. Se gestionan desde /estudio/ (función «estudio»).';

-- Un horario, una reserva: si dos personas piden el mismo turno a la vez, la segunda recibe 409.
create unique index reservas_un_turno_por_horario on public.reservas (inicio) where estado <> 'cancelada';
create index reservas_por_email on public.reservas (email, creada);

create table public.tests (
  reserva_id uuid primary key references public.reservas (id) on delete cascade,
  picks jsonb not null,
  resumen text,
  moodboard text, -- ruta en el bucket «moodboards»
  actualizado timestamptz not null default now()
);

create table public.fotos (
  id uuid primary key default gen_random_uuid(),
  reserva_id uuid not null references public.reservas (id) on delete cascade,
  ambiente text not null,
  ruta text not null, -- ruta en el bucket «ambientes»
  creada timestamptz not null default now()
);
create index fotos_por_reserva on public.fotos (reserva_id);

-- Claves del panel /estudio/: se guarda solo el SHA-256 (hex) de cada una. Para dar de baja un
-- acceso, borrar su fila.
create table public.accesos (
  nombre text primary key,
  clave_sha256 text not null unique check (clave_sha256 ~ '^[0-9a-f]{64}$'),
  creado timestamptz not null default now()
);

alter table public.reservas enable row level security;
alter table public.tests enable row level security;
alter table public.fotos enable row level security;
alter table public.accesos enable row level security;
revoke all on public.reservas, public.tests, public.fotos, public.accesos from anon, authenticated;

-- Archivos privados: se ven con links firmados que arman las funciones.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('ambientes', 'ambientes', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('moodboards', 'moodboards', false, 10485760, array['image/png'])
on conflict (id) do nothing;

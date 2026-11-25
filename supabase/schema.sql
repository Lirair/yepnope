-- ============================================================================
-- YepNope — Supabase PostgreSQL Schema, Realtime, RLS & 24h Cleanup
-- ============================================================================
-- Esegui questo script nel SQL Editor del tuo progetto Supabase.
-- ============================================================================

-- Estensioni necessarie
create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. TABELLE
-- ----------------------------------------------------------------------------

-- Tabella Stanze (effimere: scadono automaticamente dopo 24 ore)
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  category text not null check (category in ('food', 'watch', 'activity', 'custom')),
  status text not null default 'lobby' check (status in ('lobby', 'playing', 'matched', 'finished')),
  host_id uuid not null,
  theme_id text not null default 'base' check (theme_id in ('base', 'natale', 'capodanno', 'san-valentino', 'halloween', 'estate')),
  settings jsonb not null default '{}'::jsonb,
  deck jsonb not null default '[]'::jsonb,
  matched_card_ids text[] not null default '{}',
  current_match_card_id text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

-- Migrazione idempotente per database gia' esistenti
alter table public.rooms
  add column if not exists theme_id text not null default 'base';

-- Tabella Partecipanti (zero login: solo nickname e sessione anonima per stanza)
create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  room_code text not null,
  nickname text not null check (char_length(trim(nickname)) between 1 and 32),
  avatar_color text not null default '#22C55E',
  is_host boolean not null default false,
  is_active boolean not null default true,
  current_index integer not null default 0 check (current_index >= 0),
  finished boolean not null default false,
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

-- Tabella Voti (Yep = true, Nope = false)
create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  room_code text not null,
  participant_id uuid not null references public.participants(id) on delete cascade,
  card_id text not null,
  value boolean not null,
  created_at timestamptz not null default now(),
  constraint votes_unique_participant_card unique (room_id, participant_id, card_id)
);

-- ----------------------------------------------------------------------------
-- 2. INDICI PER PERFORMANCE
-- ----------------------------------------------------------------------------

create index if not exists idx_rooms_code on public.rooms (code);
create index if not exists idx_rooms_expires_at on public.rooms (expires_at);

create index if not exists idx_participants_room_id on public.participants (room_id);
create index if not exists idx_participants_room_code on public.participants (room_code);
create index if not exists idx_participants_active on public.participants (room_id, is_active);

create index if not exists idx_votes_room_card on public.votes (room_id, card_id);
create index if not exists idx_votes_room_card_value on public.votes (room_id, card_id, value);
create index if not exists idx_votes_participant on public.votes (participant_id);

-- ----------------------------------------------------------------------------
-- 3. FUNZIONE ATOMICA PER VOTAZIONE E RILEVAMENTO MATCH UNANIME
-- ----------------------------------------------------------------------------
-- Evita race condition quando due o piu' amici fanno swipe Yep nello stesso istante.
-- Un match scatta quando tutti i partecipanti attivi (minimo 2) votano Yep
-- su una carta non ancora nella lista matched_card_ids.

create or replace function public.cast_vote_and_check_match(
  p_room_id uuid,
  p_room_code text,
  p_participant_id uuid,
  p_card_id text,
  p_value boolean,
  p_next_index integer default null,
  p_finished boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.rooms%rowtype;
  v_active_count integer;
  v_yep_count integer;
  v_all_finished boolean;
  v_matched boolean := false;
begin
  -- Lock della stanza per evitare race condition
  select * into v_room
  from public.rooms
  where id = p_room_id
    and code = p_room_code
    and expires_at > now()
  for update;

  if not found then
    raise exception 'Stanza non trovata o scaduta';
  end if;

  -- Verifica che il partecipante appartenga alla stanza
  if not exists (
    select 1 from public.participants
    where id = p_participant_id
      and room_id = p_room_id
  ) then
    raise exception 'Partecipante non valido per questa stanza';
  end if;

  -- Inserisce o aggiorna il voto
  insert into public.votes (room_id, room_code, participant_id, card_id, value)
  values (p_room_id, p_room_code, p_participant_id, p_card_id, p_value)
  on conflict (room_id, participant_id, card_id)
  do update set value = excluded.value, created_at = now();

  -- Aggiorna avanzamento del partecipante
  update public.participants
  set
    current_index = coalesce(p_next_index, current_index + 1),
    finished = p_finished,
    last_seen_at = now()
  where id = p_participant_id;

  -- Conta partecipanti attivi
  select count(*) into v_active_count
  from public.participants
  where room_id = p_room_id
    and is_active = true;

  -- Controlla match unanime solo su voto Yep, con almeno 2 partecipanti attivi
  -- e se la carta non ha gia' fatto match in precedenza
  if p_value = true
     and v_active_count >= 2
     and not (p_card_id = any(v_room.matched_card_ids))
  then
    select count(distinct v.participant_id) into v_yep_count
    from public.votes v
    join public.participants p on p.id = v.participant_id
    where v.room_id = p_room_id
      and v.card_id = p_card_id
      and v.value = true
      and p.is_active = true;

    if v_yep_count >= v_active_count then
      v_matched := true;
      update public.rooms
      set
        status = 'matched',
        current_match_card_id = p_card_id,
        matched_card_ids = array_append(matched_card_ids, p_card_id)
      where id = p_room_id;
    end if;
  end if;

  -- Se non c'e' match, controlla se tutti i partecipanti attivi hanno finito il mazzo
  if not v_matched and v_room.status = 'playing' then
    select bool_and(finished) into v_all_finished
    from public.participants
    where room_id = p_room_id
      and is_active = true;

    if coalesce(v_all_finished, false) then
      update public.rooms
      set status = 'finished'
      where id = p_room_id;
    end if;
  end if;

  return jsonb_build_object(
    'matched', v_matched,
    'matched_card_id', case when v_matched then p_card_id else null end,
    'active_count', v_active_count
  );
end;
$$;

-- Funzione sicura per riprendere lo swipe dopo un match ("Continua a swipare")
create or replace function public.resume_room_swiping(
  p_room_id uuid,
  p_room_code text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_all_finished boolean;
begin
  select bool_and(finished) into v_all_finished
  from public.participants
  where room_id = p_room_id
    and is_active = true;

  update public.rooms
  set
    status = case when coalesce(v_all_finished, false) then 'finished' else 'playing' end,
    current_match_card_id = null
  where id = p_room_id
    and code = p_room_code
    and expires_at > now();
end;
$$;

-- ----------------------------------------------------------------------------
-- 4. PULIZIA AUTOMATICA STANZE > 24 ORE
-- ----------------------------------------------------------------------------

create or replace function public.cleanup_expired_rooms()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  delete from public.rooms
  where expires_at < now()
     or created_at < now() - interval '24 hours';

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

-- Schedulazione automatica ogni ora se pg_cron e' abilitato su Supabase
-- (Abilita pg_cron da Dashboard -> Database -> Extensions se desiderato)
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('yepnope-cleanup-expired-rooms')
    where exists (
      select 1 from cron.job where jobname = 'yepnope-cleanup-expired-rooms'
    );

    perform cron.schedule(
      'yepnope-cleanup-expired-rooms',
      '0 * * * *',
      'select public.cleanup_expired_rooms();'
    );
  end if;
exception
  when others then
    raise notice 'pg_cron non configurato: puoi invocare public.cleanup_expired_rooms() via Edge Function o Cron esterno.';
end;
$$;

-- ----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) PER ACCESSO ANONIMO CONTROLLATO VIA ROOM_CODE
-- ----------------------------------------------------------------------------

alter table public.rooms enable row level security;
alter table public.participants enable row level security;
alter table public.votes enable row level security;

-- Helper opzionale che legge l'header custom `x-room-code` (usato nelle query REST)
create or replace function public.request_room_code()
returns text
language sql
stable
as $$
  select upper(coalesce(
    (current_setting('request.headers', true)::json ->> 'x-room-code'),
    ''
  ));
$$;

-- Policy ROOMS:
-- Nessun elenco pubblico: lettura consentita solo per stanze non scadute
-- con filtro sul codice stanza (o evento Realtime della stanza sottoscritta).
drop policy if exists "rooms_select_by_code" on public.rooms;
create policy "rooms_select_by_code"
  on public.rooms
  for select
  to anon, authenticated
  using (
    expires_at > now()
    and (
      public.request_room_code() = ''
      or code = public.request_room_code()
    )
  );

drop policy if exists "rooms_insert_anon" on public.rooms;
create policy "rooms_insert_anon"
  on public.rooms
  for insert
  to anon, authenticated
  with check (
    code ~ '^[A-Z0-9]{6}$'
    and expires_at > now()
  );

drop policy if exists "rooms_update_by_code" on public.rooms;
create policy "rooms_update_by_code"
  on public.rooms
  for update
  to anon, authenticated
  using (
    expires_at > now()
    and (
      public.request_room_code() = ''
      or code = public.request_room_code()
    )
  )
  with check (
    expires_at > now()
  );

-- Nessuna DELETE diretta dal client: le stanze vengono pulite automaticamente dopo 24h

-- Policy PARTICIPANTS:
drop policy if exists "participants_select_by_room" on public.participants;
create policy "participants_select_by_room"
  on public.participants
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.rooms r
      where r.id = participants.room_id
        and r.code = participants.room_code
        and r.expires_at > now()
        and (
          public.request_room_code() = ''
          or r.code = public.request_room_code()
        )
    )
  );

drop policy if exists "participants_insert_by_room" on public.participants;
create policy "participants_insert_by_room"
  on public.participants
  for insert
  to anon, authenticated
  with check (
    exists (
      select 1 from public.rooms r
      where r.id = participants.room_id
        and r.code = participants.room_code
        and r.expires_at > now()
    )
  );

drop policy if exists "participants_update_by_room" on public.participants;
create policy "participants_update_by_room"
  on public.participants
  for update
  to anon, authenticated
  using (
    exists (
      select 1 from public.rooms r
      where r.id = participants.room_id
        and r.code = participants.room_code
        and r.expires_at > now()
    )
  )
  with check (
    exists (
      select 1 from public.rooms r
      where r.id = participants.room_id
        and r.code = participants.room_code
        and r.expires_at > now()
    )
  );

-- Policy VOTES:
drop policy if exists "votes_select_by_room" on public.votes;
create policy "votes_select_by_room"
  on public.votes
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.rooms r
      where r.id = votes.room_id
        and r.code = votes.room_code
        and r.expires_at > now()
        and (
          public.request_room_code() = ''
          or r.code = public.request_room_code()
        )
    )
  );

drop policy if exists "votes_insert_by_room" on public.votes;
create policy "votes_insert_by_room"
  on public.votes
  for insert
  to anon, authenticated
  with check (
    exists (
      select 1 from public.rooms r
      where r.id = votes.room_id
        and r.code = votes.room_code
        and r.expires_at > now()
    )
  );

-- Permessi sulle funzioni RPC
grant execute on function public.cast_vote_and_check_match(uuid, text, uuid, text, boolean, integer, boolean) to anon, authenticated;
grant execute on function public.resume_room_swiping(uuid, text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 6. REALTIME PUBLICATION
-- ----------------------------------------------------------------------------

alter table public.rooms replica identity full;
alter table public.participants replica identity full;
alter table public.votes replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'rooms'
  ) then
    alter publication supabase_realtime add table public.rooms;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'participants'
  ) then
    alter publication supabase_realtime add table public.participants;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'votes'
  ) then
    alter publication supabase_realtime add table public.votes;
  end if;
end;
$$;

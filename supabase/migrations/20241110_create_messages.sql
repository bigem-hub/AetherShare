-- Migration: create messages table (for potential future use)
-- Note: For the current implementation, messages are sent via Realtime broadcast.
-- This table can be used for persistent message queue in future versions.

create table if not exists public.messages (
    id            uuid default gen_random_uuid() primary key,
    room_code     text references public.rooms(code) on delete cascade,
    from_peer_id  text not null,
    to_peer_id    text not null,
    type          text not null check (type in ('offer','answer','ice')),
    payload       jsonb not null,
    created_at    timestamptz default now(),
    delivered_at  timestamptz
);

create index if not exists idx_messages_pending
    on public.messages (room_code, to_peer_id)
    where delivered_at is null;
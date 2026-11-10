-- Migration: create room_peers table (for potential future use)
-- Note: For the current implementation, peers are tracked via Realtime presence.
-- This table can be used for optional server-authoritative mode.

create table if not exists public.room_peers (
    id            uuid default gen_random_uuid() primary key,
    room_code     text references public.rooms(code) on delete cascade,
    peer_id       text not null,
    joined_at     timestamptz default now()
);

-- Index for efficient lookups
create index if not exists idx_room_peers_room on public.room_peers(room_code);
create index if not exists idx_room_peers_peer on public.room_peers(peer_id);
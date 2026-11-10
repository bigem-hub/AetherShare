-- Migration: create rooms table (for potential future use)
-- Note: For the current implementation, room codes are generated client-side.
-- This table can be used for analytics or optional server-authoritative mode.

create table if not exists public.rooms (
    code            text primary key,               -- six‑digit room identifier
    host_peer_id    text,                           -- peer_id of creator
    token           uuid,                           -- one‑time secret
    expires_at      timestamptz,                    -- room expiration
    created_at      timestamptz default now()
);

create index if not exists idx_rooms_expires_at on public.rooms(expires_at);
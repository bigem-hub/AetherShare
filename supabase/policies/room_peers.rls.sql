-- RLS Policies for room_peers table
-- Note: Current implementation uses Realtime presence only.
-- These policies are provided for future server-authoritative mode.

alter table public.room_peers enable row level security;

-- No direct client inserts
create policy "peers_insert_blocked"
    on public.room_peers
    for insert
    using (false);

-- No direct client reads
create policy "peers_select_blocked"
    on public.room_peers
    for select
    using (false);

-- No updates by clients
create policy "peers_update_blocked"
    on public.room_peers
    for update
    using (false);

-- No deletes by clients (handled by leave_room function)
create policy "peers_delete_blocked"
    on public.room_peers
    for delete
    using (false);
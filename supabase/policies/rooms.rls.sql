-- RLS Policies for rooms table
-- Note: Current implementation generates room codes client-side.
-- These policies are provided for future server-authoritative mode.

alter table public.rooms enable row level security;

-- Only allow inserting rooms via server-side function
create policy "rooms_insert_blocked"
    on public.rooms
    for insert
    using (false);

-- No direct client reads
create policy "rooms_select_blocked"
    on public.rooms
    for select
    using (false);

-- No updates by clients
create policy "rooms_update_blocked"
    on public.rooms
    for update
    using (false);

-- No deletes by clients (handled by cleanup function)
create policy "rooms_delete_blocked"
    on public.rooms
    for delete
    using (false);
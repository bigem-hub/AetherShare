-- RLS Policies for messages table
-- Note: Current implementation uses Realtime broadcast only.
-- These policies are provided for future server-authoritative mode.

alter table public.messages enable row level security;

-- No direct client access - messages are sent via Realtime channels
create policy "messages_insert_blocked"
    on public.messages
    for insert
    using (false);

-- No direct client reads
create policy "messages_select_blocked"
    on public.messages
    for select
    using (false);

-- No updates by clients
create policy "messages_update_blocked"
    on public.messages
    for update
    using (false);

-- No deletes by clients
create policy "messages_delete_blocked"
    on public.messages
    for delete
    using (false);
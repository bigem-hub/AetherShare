-- ============================================================================
-- Functions for Supabase Realtime signaling
-- ============================================================================

set search_path = public;

-- ------------------------------------------------------------------------
-- Helper: generate a six-digit random room code
-- ------------------------------------------------------------------------
create or replace function public.random_room_code()
returns text
language plpgsql
as $$
declare
    code text;
    attempts int := 0;
begin
    loop
        -- Generate a random 6-digit code
        code := lpad((floor(random() * 900000) + 100000)::int::text, 6, '0');

        -- Check for uniqueness
        if not exists (select 1 from public.rooms where code = code) then
            return code;
        end if;

        attempts := attempts + 1;
        -- Prevent infinite loops (extremely unlikely but safe)
        if attempts > 10 then
            raise exception 'Unable to generate unique room code after 10 attempts';
        end if;
    end loop;
end;
$$;

-- ------------------------------------------------------------------------
-- Function: create_room
-- Creates a new room and returns {code, token, expires_at, host_peer_id}
-- ------------------------------------------------------------------------
create or replace function public.create_room(display_name text default null)
returns jsonb
security definer
language plpgsql
as $$
declare
    new_code   text;
    new_token  uuid;
    now_ts     timestamptz := now();
    exp_ts     timestamptz := now_ts + interval '30 minutes';
    result jsonb;
begin
    -- Generate unique code and token
    new_code  := public.random_room_code();
    new_token := gen_random_uuid();

    -- Insert the room row
    insert into rooms (code, host_peer_id, token, expires_at, created_at)
    values (new_code, auth.uid(), new_token, exp_ts, now_ts);

    -- Insert the host as the first peer
    insert into room_peers (room_code, peer_id, joined_at)
    values (new_code, auth.uid(), now_ts);

    result := jsonb_build_object(
        'code',        new_code,
        'token',       new_token,
        'expires_at',  exp_ts,
        'host_peer_id', auth.uid()
    );

    return result;
end;
$$;

-- ------------------------------------------------------------------------
-- Function: join_room
-- Joins an existing room. Returns {room_code, peer_id, token, expires_at}
-- ------------------------------------------------------------------------
create or replace function public.join_room(p_code text, p_token uuid default null)
returns jsonb
security definer
language plpgsql
as $$
declare
    room_row   record;
    peer_count int;
    now_ts     timestamptz := now();
    result     jsonb;
begin
    -- Fetch room with row lock
    select * into room_row
    from rooms
    where code = p_code
      and expires_at > now_ts
    for update;

    if not found then
        raise exception 'room_not_found or expired';
    end if;

    -- Verify token if provided (only creator can provide it)
    if p_token is not null and p_token <> room_row.token then
        raise exception 'invalid_token';
    end if;

    -- Check room capacity
    select count(*) into peer_count
    from room_peers
    where room_code = p_code;

    if peer_count >= 2 then
        raise exception 'room_full';
    end if;

    -- Idempotent: check if already joined
    if not exists (
        select 1 from room_peers
        where room_code = p_code
          and peer_id = auth.uid()
    ) then
        insert into room_peers (room_code, peer_id, joined_at)
        values (p_code, auth.uid(), now_ts);
    end if;

    result := jsonb_build_object(
        'code',       p_code,
        'peer_id',    auth.uid(),
        'token',      room_row.token,
        'expires_at', room_row.expires_at
    );

    return result;
exception
    when OTHERS then
        -- Return a structured error the client can understand
        raise exception '%', sqlstate || ': ' || message;
end;
$$;

-- ------------------------------------------------------------------------
-- Function: push_message
-- Inserts a signalling message. Returns the message UUID.
-- ------------------------------------------------------------------------
create or replace function public.push_message(
    p_room_code text,
    p_type      text,
    p_payload   jsonb
) returns uuid
security definer
language plpgsql
as $$
declare
    msg_id uuid;
begin
    -- Verify the caller is a member of the room
    if not exists (
        select 1 from room_peers
        where room_code = p_room_code
          and peer_id = auth.uid()
    ) then
        raise exception 'not_a_member';
    end if;

    -- Insert the message (to_peer_id = auth.uid() for broadcast to self and other)
    insert into messages (room_code, from_peer_id, to_peer_id, type, payload, created_at)
    values (p_room_code, auth.uid(), auth.uid(), p_type, p_payload, now())
    returning id into msg_id;

    return msg_id;
end;
$$;

-- ------------------------------------------------------------------------
-- Function: push_message_to_target
-- Inserts a signalling message to a specific target peer.
-- ------------------------------------------------------------------------
create or replace function public.push_message_to_target(
    p_room_code text,
    p_to_peer_id text,
    p_type      text,
    p_payload   jsonb
) returns uuid
security definer
language plpgsql
as $$
declare
    msg_id uuid;
begin
    -- Verify the caller is a member of the room
    if not exists (
        select 1 from room_peers
        where room_code = p_room_code
          and peer_id = auth.uid()
    ) then
        raise exception 'not_a_member';
    end if;

    -- Verify the target is also a member
    if not exists (
        select 1 from room_peers
        where room_code = p_room_code
          and peer_id = p_to_peer_id
    ) then
        raise exception 'target_not_in_room';
    end if;

    insert into messages (room_code, from_peer_id, to_peer_id, type, payload, created_at)
    values (p_room_code, auth.uid(), p_to_peer_id, p_type, p_payload, now())
    returning id into msg_id;

    return msg_id;
end;
$$;

-- ------------------------------------------------------------------------
-- Function: fetch_pending_messages
-- Returns all undelivered messages for the current peer in a room.
-- ------------------------------------------------------------------------
create or replace function public.fetch_pending_messages(p_room_code text)
returns table (
    msg_id       uuid,
    msg_type     text,
    msg_payload  jsonb,
    from_peer_id text,
    created_at   timestamptz
)
security definer
language plpgsql
as $$
begin
    return query
    select id, type, payload, from_peer_id, created_at
    from messages
    where room_code = p_room_code
      and to_peer_id = auth.uid()
      and delivered_at is null
    order by created_at asc, id asc;
end;
$$;

-- ------------------------------------------------------------------------
-- Function: ack_message
-- Marks a message as delivered.
-- ------------------------------------------------------------------------
create or replace function public.ack_message(p_msg_id uuid)
returns void
security definer
language plpgsql
as $$
begin
    update messages
    set delivered_at = now()
    where id = p_msg_id
      and to_peer_id = auth.uid()
      and delivered_at is null;
end;
$$;

-- ------------------------------------------------------------------------
-- Function: leave_room
-- Leaves a room, returning {success: boolean, reason: string}
-- ------------------------------------------------------------------------
create or replace function public.leave_room(p_room_code text)
returns jsonb
security definer
language plpgsql
as $$
declare
    peer_exists boolean;
    result jsonb;
begin
    select exists (
        select 1 from room_peers
        where room_code = p_room_code
          and peer_id = auth.uid()
    ) into peer_exists;

    if not peer_exists then
        result := jsonb_build_object('success', false, 'reason', 'not_in_room');
        return result;
    end if;

    delete from room_peers
    where room_code = p_room_code
      and peer_id = auth.uid();

    result := jsonb_build_object('success', true, 'reason', null);
    return result;
end;
$$;

-- ------------------------------------------------------------------------
-- Function: cleanup_expired_data
-- Deletes expired rooms, stale peers, and delivered messages.
-- Run periodically (e.g., every 5 minutes) via Supabase Scheduler.
-- ------------------------------------------------------------------------
create or replace function public.cleanup_expired_data()
returns void
security definer
language plpgsql
as $$
begin
    -- Delete expired rooms (cascade handles peers and messages)
    delete from rooms where expires_at < now();

    -- Delete old delivered messages (older than 1 hour)
    delete from messages
    where delivered_at is not null
      and delivered_at < now() - interval '1 hour';
end;
$$;

-- ------------------------------------------------------------------------
-- Function: get_other_peer
-- Returns the other peer's ID in a room (if two peers exist).
-- Used by the host to know who to send messages to.
-- ------------------------------------------------------------------------
create or replace function public.get_other_peer(p_room_code text)
returns text
security definer
language plpgsql
as $$
declare
    other_peer text;
begin
    select peer_id into other_peer
    from room_peers
    where room_code = p_room_code
      and peer_id <> auth.uid()
    limit 1;

    return other_peer;
end;
$$;
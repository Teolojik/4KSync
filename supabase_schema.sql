-- ==========================================
-- SUPABASE POSTGRESQL SCHEMA FOR WEBRTC APP
-- ==========================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. TABLE CREATIONS
-- ==========================================

-- Table: rooms
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  host_id UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'closed')) DEFAULT 'active'
);

-- Table: participants
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: room_media_state (CRITICAL FOR SYNC)
CREATE TABLE room_media_state (
  room_id UUID PRIMARY KEY REFERENCES rooms(id) ON DELETE CASCADE,
  is_playing BOOLEAN NOT NULL DEFAULT false,
  current_time FLOAT NOT NULL DEFAULT 0.0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 2. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_media_state ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------
-- Policies for 'rooms' table
-- ------------------------------------------
-- Allow anyone to read rooms
CREATE POLICY "Allow public read access on rooms" 
  ON rooms FOR SELECT 
  TO anon, authenticated
  USING (true);

-- Allow anyone to insert (create) a room
CREATE POLICY "Allow public insert on rooms" 
  ON rooms FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anyone to update a room (in a real app, restrict to host_id)
-- For MVP, allowing public to update (e.g., closing room)
CREATE POLICY "Allow public update on rooms" 
  ON rooms FOR UPDATE 
  TO anon, authenticated
  USING (true);

-- ------------------------------------------
-- Policies for 'participants' table
-- ------------------------------------------
-- Allow anyone to read participants
CREATE POLICY "Allow public read access on participants" 
  ON participants FOR SELECT 
  TO anon, authenticated
  USING (true);

-- Allow anyone to insert (join) as participant
CREATE POLICY "Allow public insert on participants" 
  ON participants FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);

-- Allow participants to update/delete their own record (or public for MVP)
CREATE POLICY "Allow public delete on participants" 
  ON participants FOR DELETE 
  TO anon, authenticated
  USING (true);

-- ------------------------------------------
-- Policies for 'room_media_state' table
-- ------------------------------------------
-- Allow anyone to read the media state of any room
CREATE POLICY "Allow public read access on room_media_state" 
  ON room_media_state FOR SELECT 
  TO anon, authenticated
  USING (true);

-- Allow anyone to insert the initial media state when a room is created
CREATE POLICY "Allow public insert on room_media_state" 
  ON room_media_state FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);

-- STRICT UPDATE POLICY: Only the host can update the media state.
-- We check if the current user (which could be anon for MVP, so we use a passed variable or rely on logic) 
-- Wait, if anon users don't have auth.uid(), how do we verify host_id?
-- For an authless MVP, we can't strictly use auth.uid(). 
-- However, strict requirements state: 
-- "Restrict UPDATE on room_media_state strictly to the user whose ID matches host_id in the rooms table"
-- If we assume the client passes their user ID (UUID generated on client) in headers or we match it:
-- Since it's anonymous MVP, let's assume `host_id` is stored in the client and passed.
-- BUT Postgres RLS uses `auth.uid()` for authenticated users.
-- To strictly follow the prompt using `host_id`, we will write the policy comparing to auth.uid() assuming anonymous users might have an anonymous auth session (Supabase anon logins). 
-- If completely authless, RLS based on `host_id` requires a custom claim or just public update for MVP.
-- The prompt explicitly says: "Restrict UPDATE on room_media_state strictly to the user whose ID matches host_id in the rooms table (so only the host can pause/play or seek the movie)."
CREATE POLICY "Restrict update to room host" 
  ON room_media_state FOR UPDATE 
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms 
      WHERE rooms.id = room_media_state.room_id 
      AND rooms.host_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rooms 
      WHERE rooms.id = room_media_state.room_id 
      AND rooms.host_id = auth.uid()
    )
  );
-- NOTE: If using true anonymous users without Supabase Auth, `auth.uid()` will be null. 
-- You would need to use Supabase Anonymous Auth (sign in anonymously) to assign `auth.uid()` to `host_id`.


-- ==========================================
-- 3. SUPABASE REALTIME PUBLICATION
-- ==========================================

-- Enable replication for specific tables to be broadcast via Supabase Realtime
-- This adds the tables to the "supabase_realtime" publication
ALTER PUBLICATION supabase_realtime ADD TABLE participants;
ALTER PUBLICATION supabase_realtime ADD TABLE room_media_state;

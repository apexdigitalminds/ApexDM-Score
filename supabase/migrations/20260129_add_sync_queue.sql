-- Sync Queue Table
-- This table stores sync requests that need to be processed
-- Used for the hybrid sync approach: immediate if free, queued if busy

CREATE TABLE IF NOT EXISTS sync_queue (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  
  -- Status: pending → processing → completed/failed
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  
  -- Results (populated when completed)
  xp_gained INTEGER DEFAULT 0,
  actions_synced INTEGER DEFAULT 0,
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Indexes for efficient queries
  CONSTRAINT unique_pending_per_user UNIQUE (user_id, status) 
    -- Prevents duplicate pending jobs for same user
);

-- Index for finding pending jobs quickly
CREATE INDEX IF NOT EXISTS idx_sync_queue_pending 
  ON sync_queue(status, created_at) 
  WHERE status = 'pending';

-- Index for finding processing jobs (to check if anyone is syncing)
CREATE INDEX IF NOT EXISTS idx_sync_queue_processing 
  ON sync_queue(status) 
  WHERE status = 'processing';

-- Index for user status lookups
CREATE INDEX IF NOT EXISTS idx_sync_queue_user 
  ON sync_queue(user_id, created_at DESC);

-- Comment for documentation
COMMENT ON TABLE sync_queue IS 'Stores sync requests for hybrid queue processing. Jobs are processed immediately if no one else is syncing, otherwise queued for cron.';

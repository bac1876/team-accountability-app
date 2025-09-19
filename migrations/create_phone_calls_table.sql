-- Create phone_calls table
CREATE TABLE IF NOT EXISTS phone_calls (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  call_date DATE NOT NULL,
  target_calls INTEGER DEFAULT 0,
  actual_calls INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, call_date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_phone_calls_user_id ON phone_calls(user_id);
CREATE INDEX IF NOT EXISTS idx_phone_calls_date ON phone_calls(call_date);
CREATE INDEX IF NOT EXISTS idx_phone_calls_user_date ON phone_calls(user_id, call_date);
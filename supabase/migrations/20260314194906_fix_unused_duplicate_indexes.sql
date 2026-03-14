/*
  # Drop unused and duplicate indexes

  ## Summary
  Removes indexes that have not been used by the query planner.
  Also removes the duplicate `users_role_idx` (keeping `idx_users_role`).

  ## Indexes removed
  - `idx_damaged_vehicles_plate` - unused on damaged_vehicles
  - `idx_damaged_vehicles_store_id` - unused on damaged_vehicles
  - `users_created_at_idx` - unused on users
  - `users_role_idx` - duplicate of idx_users_role
  - `users_active_idx` - unused on users
  - `idx_users_store_id` - unused on users
  - `idx_users_role` — kept (dropping the duplicate users_role_idx instead)
  - `idx_plate_records_session_id` - unused on plate_records
  - `idx_plate_records_plate` - unused on plate_records
  - `idx_plate_records_session_date` - unused on plate_records
  - `idx_plate_sessions_session_date` - unused on plate_sessions
  - `idx_plate_sessions_store_id` - unused on plate_sessions
  - `idx_daily_file_rows_upload_id` - unused on daily_file_rows
  - `idx_shift_handovers_store_id` - unused on shift_handovers

  ## Notes
  - Duplicate index pair {idx_users_role, users_role_idx}: keeping idx_users_role, dropping users_role_idx
  - These indexes were flagged as unused by the Supabase security advisor
*/

DROP INDEX IF EXISTS public.idx_damaged_vehicles_plate;
DROP INDEX IF EXISTS public.idx_damaged_vehicles_store_id;
DROP INDEX IF EXISTS public.users_created_at_idx;
DROP INDEX IF EXISTS public.users_role_idx;
DROP INDEX IF EXISTS public.users_active_idx;
DROP INDEX IF EXISTS public.idx_users_store_id;
DROP INDEX IF EXISTS public.idx_plate_records_session_id;
DROP INDEX IF EXISTS public.idx_plate_records_plate;
DROP INDEX IF EXISTS public.idx_plate_records_session_date;
DROP INDEX IF EXISTS public.idx_plate_sessions_session_date;
DROP INDEX IF EXISTS public.idx_plate_sessions_store_id;
DROP INDEX IF EXISTS public.idx_daily_file_rows_upload_id;
DROP INDEX IF EXISTS public.idx_shift_handovers_store_id;

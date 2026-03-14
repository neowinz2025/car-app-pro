/*
  # Create bate_reserva table

  ## Summary
  Creates the table to store "Bate Reserva" reports — the daily reservation
  check report that is shared via WhatsApp. Each report belongs to a specific
  date and contains:
  - A time period (e.g., "06:00 até as 14:30")
  - A list of category rows, each with: category code, total count, time entries, and a status label
  - The generated WhatsApp text (cached)

  ## Tables created

  ### bate_reserva_reports
  - `id` (uuid, pk)
  - `report_date` (date) — the date this report covers
  - `store_id` (uuid, nullable) — associated store
  - `period_start` (text) — start time string, e.g. "06:00"
  - `period_end` (text) — end time string, e.g. "14:30"
  - `rows` (jsonb) — array of category rows
  - `notes` (text, nullable) — free text notes
  - `created_at`, `updated_at` (timestamps)

  ## Security
  - RLS enabled with anon/authenticated read-write access (same pattern as other tables)
*/

CREATE TABLE IF NOT EXISTS public.bate_reserva_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date date NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  period_start text NOT NULL DEFAULT '06:00',
  period_end text NOT NULL DEFAULT '14:30',
  rows jsonb NOT NULL DEFAULT '[]',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS bate_reserva_reports_date_store_idx
  ON public.bate_reserva_reports (report_date, store_id)
  WHERE store_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS bate_reserva_reports_date_no_store_idx
  ON public.bate_reserva_reports (report_date)
  WHERE store_id IS NULL;

CREATE INDEX IF NOT EXISTS bate_reserva_reports_date_idx
  ON public.bate_reserva_reports (report_date DESC);

ALTER TABLE public.bate_reserva_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view bate reserva reports"
  ON public.bate_reserva_reports FOR SELECT
  TO anon, authenticated
  USING (id IS NOT NULL);

CREATE POLICY "Anyone can insert bate reserva reports"
  ON public.bate_reserva_reports FOR INSERT
  TO anon, authenticated
  WITH CHECK (report_date IS NOT NULL);

CREATE POLICY "Anyone can update bate reserva reports"
  ON public.bate_reserva_reports FOR UPDATE
  TO anon, authenticated
  USING (id IS NOT NULL)
  WITH CHECK (report_date IS NOT NULL);

CREATE POLICY "Anyone can delete bate reserva reports"
  ON public.bate_reserva_reports FOR DELETE
  TO anon, authenticated
  USING (id IS NOT NULL);

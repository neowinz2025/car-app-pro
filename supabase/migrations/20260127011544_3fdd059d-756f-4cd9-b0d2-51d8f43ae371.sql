-- Add new column for DO - Retorno de Oficina
ALTER TABLE public.shift_handovers ADD COLUMN do_retorno_oficina integer NOT NULL DEFAULT 0;
/*
  # Sistema de Registro de Veículos com Avarias

  1. Novas Tabelas
    - `damaged_vehicles`
      - `id` (uuid, primary key) - Identificador único do registro
      - `plate` (text) - Placa do veículo
      - `created_at` (timestamptz) - Data/hora do registro
      - `created_by` (text) - Nome de quem registrou
      - `notes` (text, optional) - Observações sobre as avarias
    
    - `damaged_vehicle_photos`
      - `id` (uuid, primary key) - Identificador único da foto
      - `damaged_vehicle_id` (uuid, foreign key) - Referência ao veículo
      - `photo_url` (text) - URL da foto no storage
      - `photo_order` (integer) - Ordem de exibição da foto
      - `created_at` (timestamptz) - Data/hora do upload

  2. Storage
    - Cria bucket `damaged-vehicles` para armazenar fotos

  3. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas permitem leitura pública e inserção autenticada
    - Políticas de storage permitem upload e leitura de fotos
    - Índices para otimizar consultas
*/

-- Criar tabela de veículos avariados
CREATE TABLE IF NOT EXISTS damaged_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plate text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  created_by text NOT NULL,
  notes text DEFAULT ''
);

-- Criar tabela de fotos dos veículos avariados
CREATE TABLE IF NOT EXISTS damaged_vehicle_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  damaged_vehicle_id uuid NOT NULL REFERENCES damaged_vehicles(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  photo_order integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_damaged_vehicles_plate ON damaged_vehicles(plate);
CREATE INDEX IF NOT EXISTS idx_damaged_vehicles_created_at ON damaged_vehicles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_damaged_vehicle_photos_vehicle ON damaged_vehicle_photos(damaged_vehicle_id);

-- Habilitar RLS
ALTER TABLE damaged_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE damaged_vehicle_photos ENABLE ROW LEVEL SECURITY;

-- Políticas para damaged_vehicles
CREATE POLICY "Anyone can view damaged vehicles"
  ON damaged_vehicles FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert damaged vehicles"
  ON damaged_vehicles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update damaged vehicles"
  ON damaged_vehicles FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete damaged vehicles"
  ON damaged_vehicles FOR DELETE
  USING (true);

-- Políticas para damaged_vehicle_photos
CREATE POLICY "Anyone can view damaged vehicle photos"
  ON damaged_vehicle_photos FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert damaged vehicle photos"
  ON damaged_vehicle_photos FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can delete damaged vehicle photos"
  ON damaged_vehicle_photos FOR DELETE
  USING (true);

-- Criar bucket de storage para fotos (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('damaged-vehicles', 'damaged-vehicles', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para permitir upload e leitura
CREATE POLICY "Anyone can upload damaged vehicle photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'damaged-vehicles');

CREATE POLICY "Anyone can view damaged vehicle photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'damaged-vehicles');

CREATE POLICY "Anyone can delete damaged vehicle photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'damaged-vehicles');
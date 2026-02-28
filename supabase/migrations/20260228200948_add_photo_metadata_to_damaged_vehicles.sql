/*
  # Adicionar metadados de localização e horário às fotos de avarias

  1. Alterações na Tabela `damaged_vehicle_photos`
    - `photo_timestamp` (timestamptz) - Data e hora exata em que a foto foi tirada
    - `photo_latitude` (decimal) - Latitude da localização onde a foto foi tirada
    - `photo_longitude` (decimal) - Longitude da localização onde a foto foi tirada
    - `photo_location_accuracy` (decimal, optional) - Precisão da localização em metros
  
  2. Notas Importantes
    - Os campos de localização são opcionais (nullable) pois o usuário pode negar permissão
    - O timestamp da foto pode ser diferente do created_at (tempo de upload)
    - A precisão da localização ajuda a avaliar a confiabilidade dos dados
*/

-- Adicionar campos de metadados às fotos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'damaged_vehicle_photos' AND column_name = 'photo_timestamp'
  ) THEN
    ALTER TABLE damaged_vehicle_photos ADD COLUMN photo_timestamp timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'damaged_vehicle_photos' AND column_name = 'photo_latitude'
  ) THEN
    ALTER TABLE damaged_vehicle_photos ADD COLUMN photo_latitude decimal(10, 8);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'damaged_vehicle_photos' AND column_name = 'photo_longitude'
  ) THEN
    ALTER TABLE damaged_vehicle_photos ADD COLUMN photo_longitude decimal(11, 8);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'damaged_vehicle_photos' AND column_name = 'photo_location_accuracy'
  ) THEN
    ALTER TABLE damaged_vehicle_photos ADD COLUMN photo_location_accuracy decimal(10, 2);
  END IF;
END $$;
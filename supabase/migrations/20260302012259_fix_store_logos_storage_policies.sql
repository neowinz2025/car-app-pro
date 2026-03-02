/*
  # Corrigir políticas de storage para logos de lojas

  1. Alterações
    - Remove políticas RLS restritivas do bucket store-logos
    - Adiciona política que permite admins fazerem upload de logos
    - Adiciona política de leitura pública (bucket já é público)
  
  2. Segurança
    - Apenas admins podem fazer upload/update/delete
    - Leitura é pública (logos devem ser visíveis em PDFs e interface)
*/

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Admins can upload store logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update store logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete store logos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view store logos" ON storage.objects;

-- Criar política para admins fazerem upload
CREATE POLICY "Admins can upload store logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'store-logos' AND
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.id = auth.uid()
  )
);

-- Criar política para admins atualizarem logos
CREATE POLICY "Admins can update store logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'store-logos' AND
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'store-logos' AND
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.id = auth.uid()
  )
);

-- Criar política para admins deletarem logos
CREATE POLICY "Admins can delete store logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'store-logos' AND
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.id = auth.uid()
  )
);

-- Criar política de leitura pública
CREATE POLICY "Public can view store logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'store-logos');

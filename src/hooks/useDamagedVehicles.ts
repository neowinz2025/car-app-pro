import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { generateDamagePDF } from '@/lib/damagePdfGenerator';

export interface DamagedVehiclePhoto {
  id: string;
  damaged_vehicle_id: string;
  photo_url: string;
  photo_order: number;
  created_at: string;
}

export interface DamagedVehicle {
  id: string;
  plate: string;
  created_at: string;
  created_by: string;
  notes: string;
  photos: DamagedVehiclePhoto[];
  pdf_url?: string;
  pdf_generated_at?: string;
}

export function useDamagedVehicles() {
  const [loading, setLoading] = useState(false);

  const getAllDamagedVehicles = async (): Promise<DamagedVehicle[]> => {
    try {
      setLoading(true);
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('damaged_vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (vehiclesError) throw vehiclesError;

      const vehiclesWithPhotos = await Promise.all(
        (vehicles || []).map(async (vehicle) => {
          const { data: photos, error: photosError } = await supabase
            .from('damaged_vehicle_photos')
            .select('*')
            .eq('damaged_vehicle_id', vehicle.id)
            .order('photo_order', { ascending: true });

          if (photosError) {
            console.error('Error loading photos:', photosError);
            return { ...vehicle, photos: [] };
          }

          return { ...vehicle, photos: photos || [] };
        })
      );

      return vehiclesWithPhotos;
    } catch (error) {
      console.error('Error loading damaged vehicles:', error);
      toast.error('Erro ao carregar veículos avariados');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createDamagedVehicle = async (
    plate: string,
    createdBy: string,
    notes: string,
    photos: File[]
  ): Promise<boolean> => {
    try {
      setLoading(true);

      const { data: vehicle, error: vehicleError } = await supabase
        .from('damaged_vehicles')
        .insert({
          plate: plate.toUpperCase(),
          created_by: createdBy,
          notes: notes,
        })
        .select()
        .single();

      if (vehicleError) throw vehicleError;

      const photoUrls: DamagedVehiclePhoto[] = [];

      for (let i = 0; i < photos.length; i++) {
        const file = photos[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${vehicle.id}/${Date.now()}_${i}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('damaged-vehicles')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('damaged-vehicles')
          .getPublicUrl(fileName);

        const { data: photoData, error: photoError } = await supabase
          .from('damaged_vehicle_photos')
          .insert({
            damaged_vehicle_id: vehicle.id,
            photo_url: publicUrl,
            photo_order: i,
          })
          .select()
          .single();

        if (photoError) throw photoError;
        if (photoData) {
          photoUrls.push(photoData);
        }
      }

      toast.success('Gerando relatório PDF...', { duration: 2000 });

      try {
        const pdfBlob = await generateDamagePDF({
          plate: vehicle.plate,
          created_by: vehicle.created_by,
          created_at: vehicle.created_at,
          notes: vehicle.notes || '',
          photos: photoUrls,
        });

        const pdfFileName = `${vehicle.id}/relatorio_${Date.now()}.pdf`;
        const { error: pdfUploadError } = await supabase.storage
          .from('damaged-vehicles')
          .upload(pdfFileName, pdfBlob, {
            contentType: 'application/pdf',
          });

        if (pdfUploadError) throw pdfUploadError;

        const { data: { publicUrl: pdfUrl } } = supabase.storage
          .from('damaged-vehicles')
          .getPublicUrl(pdfFileName);

        await supabase
          .from('damaged_vehicles')
          .update({
            pdf_url: pdfUrl,
            pdf_generated_at: new Date().toISOString(),
          })
          .eq('id', vehicle.id);

        const photoFilesToDelete: string[] = [];
        for (const photo of photoUrls) {
          const urlParts = photo.photo_url.split('/damaged-vehicles/');
          if (urlParts.length > 1) {
            const path = decodeURIComponent(urlParts[1]);
            photoFilesToDelete.push(path);
          }
        }

        if (photoFilesToDelete.length > 0) {
          const { error: deletePhotosError } = await supabase.storage
            .from('damaged-vehicles')
            .remove(photoFilesToDelete);

          if (deletePhotosError) {
            console.warn('Error deleting photo files from storage:', deletePhotosError);
          }
        }

        await supabase
          .from('damaged_vehicle_photos')
          .delete()
          .eq('damaged_vehicle_id', vehicle.id);

        toast.success('Veículo registrado e PDF gerado com sucesso!');
      } catch (pdfError) {
        console.error('Error generating PDF:', pdfError);
        toast.warning('Veículo registrado, mas houve erro ao gerar o PDF');
      }

      return true;
    } catch (error) {
      console.error('Error creating damaged vehicle:', error);
      toast.error('Erro ao registrar veículo');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteDamagedVehicle = async (vehicleId: string): Promise<boolean> => {
    try {
      setLoading(true);

      const { data: vehicle } = await supabase
        .from('damaged_vehicles')
        .select('pdf_url')
        .eq('id', vehicleId)
        .single();

      const filesToDelete: string[] = [];

      if (vehicle?.pdf_url) {
        const urlParts = vehicle.pdf_url.split('/damaged-vehicles/');
        if (urlParts.length > 1) {
          const path = decodeURIComponent(urlParts[1]);
          filesToDelete.push(path);
        }
      }

      if (filesToDelete.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('damaged-vehicles')
          .remove(filesToDelete);

        if (storageError) {
          console.warn('Error deleting storage files:', storageError);
        }
      }

      const { error: deleteError } = await supabase
        .from('damaged_vehicles')
        .delete()
        .eq('id', vehicleId);

      if (deleteError) throw deleteError;

      toast.success('Veículo removido com sucesso!');
      return true;
    } catch (error) {
      console.error('Error deleting damaged vehicle:', error);
      toast.error('Erro ao remover veículo');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    getAllDamagedVehicles,
    createDamagedVehicle,
    deleteDamagedVehicle,
  };
}

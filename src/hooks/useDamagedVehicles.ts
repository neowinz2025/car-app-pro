import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

        const { error: photoError } = await supabase
          .from('damaged_vehicle_photos')
          .insert({
            damaged_vehicle_id: vehicle.id,
            photo_url: publicUrl,
            photo_order: i,
          });

        if (photoError) throw photoError;
      }

      toast.success('Veículo registrado com sucesso!');
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

      const { data: photos } = await supabase
        .from('damaged_vehicle_photos')
        .select('photo_url')
        .eq('damaged_vehicle_id', vehicleId);

      if (photos && photos.length > 0) {
        for (const photo of photos) {
          const path = photo.photo_url.split('/damaged-vehicles/')[1];
          if (path) {
            await supabase.storage
              .from('damaged-vehicles')
              .remove([path]);
          }
        }
      }

      const { error } = await supabase
        .from('damaged_vehicles')
        .delete()
        .eq('id', vehicleId);

      if (error) throw error;

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

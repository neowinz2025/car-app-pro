import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CachedPlate {
  plate: string;
  region: string;
  lastSeen: string;
  confidence: number;
}

const CACHE_KEY = 'plate_cache_v1';
const MAX_CACHE_SIZE = 500;
const CACHE_EXPIRY_DAYS = 30;

export function usePlateCache() {
  const [cache, setCache] = useState<Map<string, CachedPlate>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  // Load cache from localStorage on mount
  useEffect(() => {
    const loadCache = () => {
      try {
        const stored = localStorage.getItem(CACHE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const now = new Date();
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() - CACHE_EXPIRY_DAYS);

          // Filter out expired entries
          const validEntries = Object.entries(parsed).filter(([_, value]: [string, any]) => {
            const lastSeen = new Date(value.lastSeen);
            return lastSeen > expiryDate;
          });

          setCache(new Map(validEntries as [string, CachedPlate][]));
        }
      } catch (error) {
        console.error('Error loading plate cache:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCache();
  }, []);

  // Save cache to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      try {
        const cacheObject = Object.fromEntries(cache);
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheObject));
      } catch (error) {
        console.error('Error saving plate cache:', error);
      }
    }
  }, [cache, isLoading]);

  // Sync with Supabase - load valid plates from database
  const syncWithDatabase = useCallback(async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('plates')
        .select('plate_number, created_at')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(MAX_CACHE_SIZE);

      if (error) {
        console.error('Error syncing with database:', error);
        return;
      }

      if (data && data.length > 0) {
        const newCache = new Map(cache);

        data.forEach((record) => {
          const plate = record.plate_number.toUpperCase();
          if (!newCache.has(plate)) {
            newCache.set(plate, {
              plate,
              region: 'BR',
              lastSeen: record.created_at,
              confidence: 1.0,
            });
          }
        });

        setCache(newCache);
      }
    } catch (error) {
      console.error('Error syncing plate cache:', error);
    }
  }, [cache]);

  // Check if plate exists in cache
  const hasPlate = useCallback((plate: string): boolean => {
    return cache.has(plate.toUpperCase());
  }, [cache]);

  // Get plate from cache
  const getPlate = useCallback((plate: string): CachedPlate | undefined => {
    return cache.get(plate.toUpperCase());
  }, [cache]);

  // Add plate to cache
  const addPlate = useCallback((plate: string, region: string = 'BR', confidence: number = 1.0) => {
    const upperPlate = plate.toUpperCase();
    const newCache = new Map(cache);

    newCache.set(upperPlate, {
      plate: upperPlate,
      region,
      lastSeen: new Date().toISOString(),
      confidence,
    });

    // Limit cache size
    if (newCache.size > MAX_CACHE_SIZE) {
      const firstKey = newCache.keys().next().value;
      newCache.delete(firstKey);
    }

    setCache(newCache);
  }, [cache]);

  // Clear cache
  const clearCache = useCallback(() => {
    setCache(new Map());
    localStorage.removeItem(CACHE_KEY);
  }, []);

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    return {
      size: cache.size,
      maxSize: MAX_CACHE_SIZE,
      expiryDays: CACHE_EXPIRY_DAYS,
    };
  }, [cache]);

  return {
    hasPlate,
    getPlate,
    addPlate,
    clearCache,
    syncWithDatabase,
    getCacheStats,
    isLoading,
    cacheSize: cache.size,
  };
}

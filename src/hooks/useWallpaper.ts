import { useState, useEffect, useCallback } from 'react';

const WALLPAPER_KEY = 'app_wallpaper';

export function useWallpaper() {
  const [wallpaper, setWallpaperState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(WALLPAPER_KEY);
    }
    return null;
  });

  useEffect(() => {
    if (wallpaper) {
      localStorage.setItem(WALLPAPER_KEY, wallpaper);
    } else {
      localStorage.removeItem(WALLPAPER_KEY);
    }
  }, [wallpaper]);

  const setWallpaper = useCallback((url: string | null) => {
    setWallpaperState(url);
  }, []);

  const clearWallpaper = useCallback(() => {
    setWallpaperState(null);
  }, []);

  return { wallpaper, setWallpaper, clearWallpaper };
}

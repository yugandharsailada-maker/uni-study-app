import { useState } from 'react';
import { Image, X, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface WallpaperSettingsProps {
  wallpaper: string | null;
  onSetWallpaper: (url: string | null) => void;
  inline?: boolean; // If true, render inline without popover
}

export function WallpaperSettings({ wallpaper, onSetWallpaper, inline = false }: WallpaperSettingsProps) {
  const [urlInput, setUrlInput] = useState('');

  const handleSetUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    try {
      const url = new URL(trimmed);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        toast.error('Only http:// and https:// URLs are allowed');
        return;
      }
      onSetWallpaper(trimmed);
      setUrlInput('');
      toast.success('Wallpaper set successfully');
    } catch {
      toast.error('Invalid URL format');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        onSetWallpaper(dataUrl);
        toast.success('Wallpaper set successfully');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClear = () => {
    onSetWallpaper(null);
    toast.success('Wallpaper removed');
  };

  if (inline) {
    return (
      <div className="space-y-3">
        <div className="space-y-3">

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Upload Image</label>
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="cursor-pointer"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-popover px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Paste Image URL</label>
            <div className="flex gap-2">
              <Input
                placeholder="https://..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSetUrl()}
              />
              <Button onClick={handleSetUrl} size="icon" className="shrink-0">
                <Link2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {wallpaper && (
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">Current wallpaper:</p>
                <Button variant="ghost" size="sm" onClick={handleClear} className="h-8 text-destructive hover:text-destructive">
                  <X className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
              <div className="h-20 rounded-md overflow-hidden border">
                <img
                  src={wallpaper}
                  alt="Current wallpaper"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>

        {wallpaper && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">Current wallpaper:</p>
            <div className="h-20 rounded-md overflow-hidden border">
              <img
                src={wallpaper}
                alt="Current wallpaper"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Original popover version (for backward compatibility if needed)
  return null;
}

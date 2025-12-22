import { useState } from 'react';
import { Image, X, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';

interface WallpaperSettingsProps {
  wallpaper: string | null;
  onSetWallpaper: (url: string | null) => void;
}

export function WallpaperSettings({ wallpaper, onSetWallpaper }: WallpaperSettingsProps) {
  const [urlInput, setUrlInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSetUrl = () => {
    if (urlInput.trim()) {
      onSetWallpaper(urlInput.trim());
      setUrlInput('');
      setIsOpen(false);
      toast.success('Wallpaper set successfully');
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
        setIsOpen(false);
        toast.success('Wallpaper set successfully');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClear = () => {
    onSetWallpaper(null);
    setIsOpen(false);
    toast.success('Wallpaper removed');
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Image className="h-5 w-5" />
          {wallpaper && (
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Background Wallpaper</h4>
            {wallpaper && (
              <Button variant="ghost" size="sm" onClick={handleClear} className="h-8 text-destructive hover:text-destructive">
                <X className="h-4 w-4 mr-1" />
                Remove
              </Button>
            )}
          </div>

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
      </PopoverContent>
    </Popover>
  );
}

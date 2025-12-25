import { useState, useEffect } from 'react';
import { Settings, LogOut, Palette, Type, Image, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { WallpaperSettings } from './WallpaperSettings';

interface SettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  wallpaper: string | null;
  onSetWallpaper: (url: string | null) => void;
  onSignOut: () => void;
}

// Helper to convert HSL string to RGB
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return [r, g, b];
}

// Helper to convert RGB to HSL
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

// Parse HSL from CSS variable
function parseHsl(hslString: string): [number, number, number] {
  const match = hslString.match(/(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%/);
  if (match) {
    return [parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3])];
  }
  return [0, 0, 0];
}

// Get CSS variable value
function getCssVariable(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// Set CSS variable
function setCssVariable(name: string, value: string) {
  document.documentElement.style.setProperty(name, value);
}

export function SettingsSidebar({
  isOpen,
  onClose,
  wallpaper,
  onSetWallpaper,
  onSignOut,
}: SettingsSidebarProps) {
  const [fontColor, setFontColor] = useState('#000000');
  const [uiColor, setUiColor] = useState('#3b82f6');

  // Load current colors from CSS variables
  useEffect(() => {
    if (isOpen) {
      const foreground = getCssVariable('--foreground');
      const primary = getCssVariable('--primary');
      
      if (foreground) {
        const [h, s, l] = parseHsl(foreground);
        const [r, g, b] = hslToRgb(h, s, l);
        setFontColor(`#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`);
      }
      
      if (primary) {
        const [h, s, l] = parseHsl(primary);
        const [r, g, b] = hslToRgb(h, s, l);
        setUiColor(`#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`);
      }
    }
  }, [isOpen]);

  const handleFontColorChange = (color: string) => {
    setFontColor(color);
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    const [h, s, l] = rgbToHsl(r, g, b);
    
    setCssVariable('--foreground', `${h} ${s}% ${l}%`);
    setCssVariable('--card-foreground', `${h} ${s}% ${l}%`);
    setCssVariable('--popover-foreground', `${h} ${s}% ${l}%`);
    
    // Save to localStorage
    localStorage.setItem('customFontColor', color);
    localStorage.setItem('customForegroundHsl', `${h} ${s}% ${l}%`);
  };

  const handleUiColorChange = (color: string) => {
    setUiColor(color);
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    const [h, s, l] = rgbToHsl(r, g, b);
    
    setCssVariable('--primary', `${h} ${s}% ${l}%`);
    setCssVariable('--accent', `${h} ${s}% ${l}%`);
    setCssVariable('--ring', `${h} ${s}% ${l}%`);
    setCssVariable('--glow-primary', `${h} ${s}% ${l}%`);
    
    // Save to localStorage
    localStorage.setItem('customUiColor', color);
    localStorage.setItem('customPrimaryHsl', `${h} ${s}% ${l}%`);
  };

  const handleResetColors = () => {
    // Reset to default values
    const isDark = document.documentElement.classList.contains('dark');
    
    if (isDark) {
      setCssVariable('--foreground', '0 0% 98%');
      setCssVariable('--card-foreground', '0 0% 98%');
      setCssVariable('--popover-foreground', '0 0% 98%');
      setCssVariable('--primary', '217 91% 60%');
      setCssVariable('--accent', '217 91% 60%');
      setCssVariable('--ring', '217 91% 60%');
      setCssVariable('--glow-primary', '217 91% 60%');
      setFontColor('#fafafa');
      setUiColor('#3b82f6');
    } else {
      setCssVariable('--foreground', '240 10% 3.9%');
      setCssVariable('--card-foreground', '240 10% 3.9%');
      setCssVariable('--popover-foreground', '240 10% 3.9%');
      setCssVariable('--primary', '221 83% 53%');
      setCssVariable('--accent', '221 83% 53%');
      setCssVariable('--ring', '221 83% 53%');
      setCssVariable('--glow-primary', '221 83% 53%');
      setFontColor('#0a0a0a');
      setUiColor('#2563eb');
    }
    
    localStorage.removeItem('customFontColor');
    localStorage.removeItem('customForegroundHsl');
    localStorage.removeItem('customUiColor');
    localStorage.removeItem('customPrimaryHsl');
    toast.success('Colors reset to default');
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </SheetTitle>
          <SheetDescription>
            Customize your experience with colors, wallpaper, and more.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Font Color Picker */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4 text-muted-foreground" />
              <Label className="text-base font-semibold">Font Color</Label>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Input
                  type="color"
                  value={fontColor}
                  onChange={(e) => handleFontColorChange(e.target.value)}
                  className="h-12 w-20 cursor-pointer"
                />
                <Input
                  type="text"
                  value={fontColor}
                  onChange={(e) => {
                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                      handleFontColorChange(e.target.value);
                    } else {
                      setFontColor(e.target.value);
                    }
                  }}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Controls text color for headings, labels, and content
              </p>
            </div>
          </div>

          <Separator />

          {/* UI Block Elements Color Picker */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <Label className="text-base font-semibold">UI Block Elements</Label>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Input
                  type="color"
                  value={uiColor}
                  onChange={(e) => handleUiColorChange(e.target.value)}
                  className="h-12 w-20 cursor-pointer"
                />
                <Input
                  type="text"
                  value={uiColor}
                  onChange={(e) => {
                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                      handleUiColorChange(e.target.value);
                    } else {
                      setUiColor(e.target.value);
                    }
                  }}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Controls primary color for buttons, links, and interactive elements
              </p>
            </div>
          </div>

          <Separator />

          {/* Wallpaper Settings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4 text-muted-foreground" />
              <Label className="text-base font-semibold">Background Wallpaper</Label>
            </div>
            <WallpaperSettings wallpaper={wallpaper} onSetWallpaper={onSetWallpaper} inline />
          </div>

          <Separator />

          {/* Reset Colors Button */}
          <div className="space-y-2">
            <Button
              variant="outline"
              onClick={handleResetColors}
              className="w-full"
            >
              Reset Colors to Default
            </Button>
          </div>

          <Separator />

          {/* Sign Out Button */}
          <div className="pt-4">
            <Button
              variant="destructive"
              onClick={onSignOut}
              className="w-full gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}


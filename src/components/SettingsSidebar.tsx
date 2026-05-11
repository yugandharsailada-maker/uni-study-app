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
import { usePreferences } from '@/contexts/PreferencesContext';
import { useTheme } from '@/hooks/useTheme';
import { Switch } from '@/components/ui/switch';
import { Eye, EyeOff } from 'lucide-react';

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

// Helper to get contrast color (black or white)
function getContrastColor(r: number, g: number, b: number): string {
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
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

// Helper to remove CSS variable
function removeCssVariable(name: string) {
  document.documentElement.style.removeProperty(name);
}

export function SettingsSidebar({
  isOpen,
  onClose,
  wallpaper,
  onSetWallpaper,
  onSignOut,
}: SettingsSidebarProps) {
  const { showGrades, setShowGrades } = usePreferences();
  const { theme, toggleTheme } = useTheme();
  const [fontColor, setFontColor] = useState('#000000');
  const [uiColor, setUiColor] = useState('#3b82f6');
  const [subjectBlockColor, setSubjectBlockColor] = useState('#ffffff');

  // Load current colors from CSS variables
  useEffect(() => {
    if (isOpen) {
      const foreground = getCssVariable('--foreground');
      const primary = getCssVariable('--primary');
      const isDark = document.documentElement.classList.contains('dark');

      if (foreground) {
        const [h, s, l] = parseHsl(foreground);
        const [r, g, b] = hslToRgb(h, s, l);
        const hex = `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;

        // If it's a default theme color (black in light mode or white in dark mode), 
        // ensure we show it correctly, but don't consider it "custom" if it matches default.
        setFontColor(hex);
      } else {
        setFontColor(isDark ? '#fafafa' : '#0a0a0a');
      }

      if (primary) {
        const [h, s, l] = parseHsl(primary);
        const [r, g, b] = hslToRgb(h, s, l);
        setUiColor(`#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`);
      }

      const subjectBg = getCssVariable('--subject-card-bg');
      if (subjectBg) {
        const [h, s, l] = parseHsl(subjectBg);
        const [r, g, b] = hslToRgb(h, s, l);
        setSubjectBlockColor(`#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`);
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

    // Save to localStorage (theme-scoped)
    const themeKey = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    localStorage.setItem('customFontColor', color);
    localStorage.setItem(`customForegroundHsl_${themeKey}`, `${h} ${s}% ${l}%`);
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

    // Save to localStorage (theme-scoped)
    const themeUiKey = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    localStorage.setItem('customUiColor', color);
    localStorage.setItem(`customPrimaryHsl_${themeUiKey}`, `${h} ${s}% ${l}%`);
    localStorage.setItem('customPrimaryHsl', `${h} ${s}% ${l}%`);
  };

  const handleSubjectBlockColorChange = (color: string) => {
    setSubjectBlockColor(color);
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    const [h, s, l] = rgbToHsl(r, g, b);

    // Calculate contrast color
    const contrastColor = getContrastColor(r, g, b);
    const [ch, cs, cl] = contrastColor === '#000000' ? [0, 0, 0] : [0, 0, 100];

    // Set CSS variables
    setCssVariable('--subject-card-bg', `${h} ${s}% ${l}%`);
    setCssVariable('--subject-card-fg', `${ch} ${cs}% ${cl}%`);

    // Save to localStorage (theme-scoped)
    const themeSubKey = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    localStorage.setItem('customSubjectBlockColor', color);
    localStorage.setItem(`customSubjectCardBgHsl_${themeSubKey}`, `${h} ${s}% ${l}%`);
    localStorage.setItem(`customSubjectCardFgHsl_${themeSubKey}`, `${ch} ${cs}% ${cl}%`);
    localStorage.setItem('customSubjectCardBgHsl', `${h} ${s}% ${l}%`);
    localStorage.setItem('customSubjectCardFgHsl', `${ch} ${cs}% ${cl}%`);
  };

  const handleResetColors = () => {
    // Remove all custom color CSS variables
    const varsToRemove = [
      '--foreground',
      '--card-foreground',
      '--popover-foreground',
      '--primary',
      '--accent',
      '--ring',
      '--glow-primary',
      '--subject-card-bg',
      '--subject-card-fg'
    ];
    varsToRemove.forEach(removeCssVariable);

    // Update state to match defaults
    const isDark = document.documentElement.classList.contains('dark');
    setFontColor(isDark ? '#fafafa' : '#0a0a0a');
    setUiColor(isDark ? '#3b82f6' : '#2563eb');
    setSubjectBlockColor(isDark ? '#0f172a' : '#ffffff');

    // Remove both theme-scoped and legacy keys
    localStorage.removeItem('customFontColor');
    localStorage.removeItem('customForegroundHsl');
    localStorage.removeItem('customForegroundHsl_dark');
    localStorage.removeItem('customForegroundHsl_light');
    localStorage.removeItem('customUiColor');
    localStorage.removeItem('customPrimaryHsl');
    localStorage.removeItem('customPrimaryHsl_dark');
    localStorage.removeItem('customPrimaryHsl_light');
    localStorage.removeItem('customSubjectBlockColor');
    localStorage.removeItem('customSubjectCardBgHsl');
    localStorage.removeItem('customSubjectCardBgHsl_dark');
    localStorage.removeItem('customSubjectCardBgHsl_light');
    localStorage.removeItem('customSubjectCardFgHsl');
    localStorage.removeItem('customSubjectCardFgHsl_dark');
    localStorage.removeItem('customSubjectCardFgHsl_light');

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
          {/* Privacy Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {showGrades ? (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                )}
                <Label className="text-base font-semibold">Show Grades</Label>
              </div>
              <Switch
                checked={showGrades}
                onCheckedChange={setShowGrades}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Toggle visibility of CGPA, SGPA, and individual subject marks.
            </p>
          </div>

          <Separator />

          {/* Theme Toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <Label className="text-base font-semibold">Dark Mode</Label>
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Toggle between light and dark themes.
            </p>
          </div>

          <Separator />

          {/* Font Color Picker - Only visible when wallpaper is active */}
          {wallpaper && (
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
                  (Overrides default theme color)
                </p>
              </div>
            </div>
          )}

          {wallpaper && <Separator />}

          {/* Subject Block Color Picker */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div
                className="h-4 w-4 rounded border border-muted-foreground"
                style={{ backgroundColor: 'hsl(var(--subject-card-bg))' }}
              />
              <Label className="text-base font-semibold">Subject Blocks</Label>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Input
                  type="color"
                  value={subjectBlockColor}
                  onChange={(e) => handleSubjectBlockColorChange(e.target.value)}
                  className="h-12 w-20 cursor-pointer"
                />
                <Input
                  type="text"
                  value={subjectBlockColor}
                  onChange={(e) => {
                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                      handleSubjectBlockColorChange(e.target.value);
                    } else {
                      setSubjectBlockColor(e.target.value);
                    }
                  }}
                  placeholder="#ffffff"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Controls background color for subject cards. Text color auto-adjusts for contrast.
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

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4 text-muted-foreground" />
              <Label className="text-base font-semibold">Background Wallpaper</Label>
            </div>
            <WallpaperSettings
              wallpaper={wallpaper}
              onSetWallpaper={(url) => {
                onSetWallpaper(url);
                if (!url) {
                  // If wallpaper is removed, reset font color to default by removing the override
                  removeCssVariable('--foreground');
                  removeCssVariable('--card-foreground');
                  removeCssVariable('--popover-foreground');

                  const isDark = document.documentElement.classList.contains('dark');
                  setFontColor(isDark ? '#fafafa' : '#0a0a0a');
                  localStorage.removeItem('customFontColor');
                  localStorage.removeItem('customForegroundHsl');
                  localStorage.removeItem('customForegroundHsl_dark');
                  localStorage.removeItem('customForegroundHsl_light');
                }
              }}
              inline
            />
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


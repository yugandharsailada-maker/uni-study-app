
import { useState, useRef, useEffect } from 'react';
import {
    User,
    School,
    FileText,
    Lock,
    Unlock,
    Camera,
    ShieldCheck,
    ChevronRight,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useProfile } from '@/contexts/ProfileContext';
import { PinDialog } from './PinDialog';
import { toast } from 'sonner';

interface ProfileSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ProfileSidebar({ isOpen, onClose }: ProfileSidebarProps) {
    const { profile, updateProfile } = useProfile();
    const [isLocked, setIsLocked] = useState(true);
    const [pinDialogMode, setPinDialogMode] = useState<'create' | 'unlock'>('unlock');
    const [showPinDialog, setShowPinDialog] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Only lock when sidebar transitions from closed to open
    const prevOpenRef = useRef(isOpen);
    useEffect(() => {
        // Only auto-lock when sidebar opens from a closed state
        if (isOpen && !prevOpenRef.current) {
            setIsLocked(!!profile.pin);
        }
        prevOpenRef.current = isOpen;
    }, [isOpen, profile.pin]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Check file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                toast.error('Image size should be less than 2MB');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                updateProfile({ profilePic: reader.result as string });
                toast.success('Profile picture updated');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUnlockClick = () => {
        setPinDialogMode('unlock');
        setShowPinDialog(true);
    };

    const handleSetPinClick = () => {
        setPinDialogMode('create');
        setShowPinDialog(true);
    };

    const handlePinSuccess = (newPin?: string, newHint?: string) => {
        if (pinDialogMode === 'create' && newPin && newHint) {
            updateProfile({ pin: newPin, pinHint: newHint });
            setIsLocked(false);
            toast.success('Privacy PIN set successfully');
        } else if (pinDialogMode === 'unlock') {
            setIsLocked(false);
            toast.success('Section unlocked');
        }
    };

    return (
        <>
            <Sheet
                open={isOpen}
                onOpenChange={(open) => {
                    if (!open && showPinDialog) return;
                    onClose();
                }}
            >
                <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Student Profile
                        </SheetTitle>
                        <SheetDescription>
                            Manage your personal details and privacy settings.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="mt-8 space-y-8">
                        {/* Profile Picture Section */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <Avatar className="h-24 w-24 border-2 border-primary/20 group-hover:border-primary transition-colors">
                                    <AvatarImage src={profile.profilePic || undefined} className="object-cover" />
                                    <AvatarFallback className="bg-primary/5 text-primary">
                                        <Logo className="h-10 w-10" />
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="h-8 w-8 text-white" />
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/png, image/jpeg"
                                    onChange={handleFileChange}
                                />
                            </div>
                            <p className="text-sm text-muted-foreground text-center">
                                Tap to update photo<br />
                                <span className="text-xs opacity-70">PNG, JPG up to 2MB</span>
                            </p>
                        </div>

                        <Separator />

                        {/* Academic Details */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-primary font-medium">
                                <School className="h-4 w-4" />
                                <h3>Academic Details</h3>
                            </div>

                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <Label htmlFor="name">Student Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g. John Doe"
                                        value={profile.name}
                                        onChange={(e) => updateProfile({ name: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="college">College Name</Label>
                                    <Input
                                        id="college"
                                        placeholder="e.g. Institute of Technology"
                                        value={profile.collegeName}
                                        onChange={(e) => updateProfile({ collegeName: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="rollNo">Roll Number</Label>
                                    <Input
                                        id="rollNo"
                                        placeholder="e.g. B251181EN"
                                        value={profile.rollNo}
                                        onChange={(e) => updateProfile({ rollNo: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* About Me Section (Protected) */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-primary font-medium">
                                {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                                <h3>About Me</h3>
                            </div>

                            <div className="relative rounded-xl border bg-card overflow-hidden transition-all duration-300">
                                {!profile.pin ? (
                                    // State 1: No PIN Set
                                    <div className="p-8 flex flex-col items-center justify-center text-center gap-3">
                                        <div className="p-3 rounded-full bg-primary/10 text-primary">
                                            <ShieldCheck className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold">Secure Note Area</h4>
                                            <p className="text-sm text-muted-foreground mt-1 mb-3">
                                                Set a privacy PIN to write private details here.
                                            </p>
                                        </div>
                                        <Button onClick={handleSetPinClick} className="w-full">
                                            Set Privacy PIN
                                        </Button>
                                    </div>
                                ) : isLocked ? (
                                    // State 2: Locked
                                    <div className="p-8 flex flex-col items-center justify-center text-center gap-3 bg-muted/30">
                                        <div className="p-3 rounded-full bg-muted text-muted-foreground">
                                            <Lock className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold">Content Locked</h4>
                                            <p className="text-sm text-muted-foreground mt-1 mb-3">
                                                Enter your PIN to view and edit.
                                            </p>
                                        </div>
                                        <Button onClick={handleUnlockClick} variant="outline" className="w-full">
                                            Unlock to View
                                        </Button>
                                    </div>
                                ) : (
                                    // State 3: Unlocked
                                    <div className="p-4 space-y-4 animate-in fade-in slide-in-from-top-4">
                                        <Textarea
                                            autoFocus
                                            placeholder="Write something about yourself..."
                                            className="min-h-[150px] resize-none border-0 shadow-none focus-visible:ring-0 p-0 text-base bg-transparent"
                                            value={profile.aboutMe}
                                            onChange={(e) => updateProfile({ aboutMe: e.target.value })}
                                        />
                                        <div className="flex gap-2 justify-end pt-2 border-t border-border/50">
                                            <Button variant="ghost" size="sm" onClick={handleSetPinClick} className="text-xs h-7">
                                                Change PIN
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-xs h-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => {
                                                    if (window.confirm("Remove PIN protection?")) {
                                                        updateProfile({ pin: undefined, pinHint: undefined });
                                                        setIsLocked(false);
                                                        toast.success("PIN protection removed");
                                                    }
                                                }}
                                            >
                                                Remove PIN
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            <PinDialog
                isOpen={showPinDialog}
                onClose={() => setShowPinDialog(false)}
                mode={pinDialogMode}
                existingPin={profile.pin}
                existingHint={profile.pinHint}
                onSuccess={handlePinSuccess}
            />
        </>
    );
}

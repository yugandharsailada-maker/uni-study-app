
import { useState, useEffect } from 'react';
import { Lock, Unlock, HelpCircle, Delete } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

interface PinDialogProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'create' | 'unlock';
    existingPin?: string | null;
    existingHint?: string | null;
    onSuccess: (pin?: string, hint?: string) => void;
}

export function PinDialog({
    isOpen,
    onClose,
    mode,
    existingPin,
    existingHint,
    onSuccess,
}: PinDialogProps) {
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [hint, setHint] = useState('');
    const [step, setStep] = useState<'enter' | 'confirm' | 'hint'>('enter');
    const [error, setError] = useState(false);
    const [showHint, setShowHint] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setPin('');
            setConfirmPin('');
            setHint('');
            setStep('enter');
            setError(false);
            setShowHint(false);
        }
    }, [isOpen]);

    const handleNumClick = (num: number) => {
        if (error) setError(false);

        if (mode === 'unlock') {
            if (pin.length < 4) {
                const newPin = pin + num;
                setPin(newPin);
                if (newPin.length === 4) {
                    verifyPin(newPin);
                }
            }
        } else {
            // Create mode
            if (step === 'enter') {
                if (pin.length < 3) {
                    setPin(pin + num);
                } else if (pin.length === 3) {
                    setPin(pin + num);
                    setTimeout(() => setStep('confirm'), 200);
                }
            } else if (step === 'confirm') {
                if (confirmPin.length < 3) {
                    setConfirmPin(confirmPin + num);
                } else if (confirmPin.length === 3) {
                    const newConfirm = confirmPin + num;
                    setConfirmPin(newConfirm);
                    if (newConfirm === pin) {
                        setTimeout(() => setStep('hint'), 200);
                    } else {
                        setError(true);
                        setTimeout(() => {
                            setConfirmPin('');
                            setError(false);
                        }, 500);
                        toast.error("PINs don't match");
                    }
                }
            }
        }
    };

    const verifyPin = (inputPin: string) => {
        if (inputPin === existingPin) {
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 300);
        } else {
            setError(true);
            setTimeout(() => {
                setPin('');
                setError(false);
            }, 500);
            toast.error('Incorrect PIN');
        }
    };

    const handleBackspace = () => {
        if (mode === 'unlock' || step === 'enter') {
            setPin(prev => prev.slice(0, -1));
        } else if (step === 'confirm') {
            setConfirmPin(prev => prev.slice(0, -1));
        }
        setError(false);
    };

    const handleCreateSubmit = () => {
        if (hint.trim().length === 0) {
            toast.error('Please enter a hint');
            return;
        }
        onSuccess(pin, hint);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            {/* Increase z-index to potential max to sit above Sheet if needed, but Radix usually handles this.*/}
            <DialogContent className="sm:max-w-sm z-[202]">
                <DialogHeader className="flex flex-col items-center text-center">
                    <div className="mb-4 inline-flex items-center justify-center p-3 rounded-full bg-primary/10 text-primary">
                        {mode === 'unlock' ? <Lock className="h-6 w-6" /> : <Unlock className="h-6 w-6" />}
                    </div>
                    <DialogTitle className="text-xl font-bold">
                        {mode === 'unlock'
                            ? 'Enter PIN'
                            : step === 'enter'
                                ? 'Set New PIN'
                                : step === 'confirm'
                                    ? 'Confirm PIN'
                                    : 'Add a Hint'}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === 'unlock'
                            ? 'Enter your 4-digit PIN to unlock private details'
                            : step === 'hint'
                                ? 'Add a hint in case you forget your PIN'
                                : 'Create a 4-digit PIN to secure your details'}
                    </DialogDescription>
                </DialogHeader>

                {/* Manual Confirm Button for confused users */}
                {mode === 'create' && step !== 'hint' && (
                    <div className="px-6 pb-2 w-full">
                        <Button
                            className="w-full"
                            size="sm"
                            disabled={(step === 'enter' && pin.length < 4) || (step === 'confirm' && confirmPin.length < 4)}
                            onClick={() => {
                                if (step === 'enter') setStep('confirm');
                                else if (step === 'confirm') {
                                    if (confirmPin === pin) setStep('hint');
                                    else {
                                        setError(true);
                                        toast.error("PINs don't match");
                                        setConfirmPin('');
                                    }
                                }
                            }}
                        >
                            {step === 'enter' ? 'Next' : 'Confirm'}
                        </Button>
                    </div>
                )}

                {/* PIN Display */}
                {step !== 'hint' && (
                    <div className="py-2 flex justify-center gap-4">
                        {[0, 1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className={`w-4 h-4 rounded-full transition-all duration-200 ${error
                                    ? 'bg-destructive' // Simplified animate-shake logic
                                    : (step === 'confirm' ? confirmPin.length : pin.length) > i
                                        ? 'bg-primary scale-110'
                                        : 'bg-muted scale-90'
                                    }`}
                            />
                        ))}
                    </div>
                )}

                {/* Hint Input */}
                {step === 'hint' && (
                    <div className="p-6 pt-0 space-y-4 w-full">
                        <Input
                            value={hint}
                            onChange={(e) => setHint(e.target.value)}
                            placeholder="e.g. My childhood pet..."
                            className="text-center"
                            autoFocus
                        />
                        <Button className="w-full" onClick={handleCreateSubmit}>
                            Save Security Settings
                        </Button>
                    </div>
                )}

                {/* Numpad */}
                {step !== 'hint' && (
                    <div className="p-6 pt-0 w-full">
                        <div className="grid grid-cols-3 gap-3 w-full max-w-[240px] mx-auto">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                <Button
                                    key={num}
                                    variant="outline"
                                    className="h-14 text-xl font-semibold rounded-xl hover:bg-muted/50 transition-colors"
                                    onClick={() => handleNumClick(num)}
                                >
                                    {num}
                                </Button>
                            ))}
                            <div className="flex items-center justify-center">
                                {mode === 'unlock' && showHint ? (
                                    <div className="text-xs text-center text-muted-foreground bg-muted/50 p-2 rounded animate-in fade-in">
                                        Hint: {existingHint || 'No hint set'}
                                    </div>
                                ) : mode === 'unlock' ? (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground"
                                        onClick={() => setShowHint(true)}
                                        title="Show Hint"
                                    >
                                        <HelpCircle className="h-5 w-5" />
                                    </Button>
                                ) : null}
                            </div>
                            <Button
                                variant="outline"
                                className="h-14 text-xl font-semibold rounded-xl"
                                onClick={() => handleNumClick(0)}
                            >
                                0
                            </Button>
                            <Button
                                variant="ghost"
                                className="h-14 rounded-xl text-muted-foreground hover:text-destructive transition-colors"
                                onClick={handleBackspace}
                            >
                                <Delete className="h-6 w-6" />
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

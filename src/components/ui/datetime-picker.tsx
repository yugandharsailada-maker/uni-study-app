import { forwardRef } from 'react';
import { Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DateTimePickerProps {
    value?: Date;
    onChange: (date: Date | undefined) => void;
    placeholder?: string;
    className?: string;
}

export const DateTimePicker = forwardRef<HTMLInputElement, DateTimePickerProps>(
    ({ value, onChange, placeholder = 'Pick a date & time', className }, ref) => {
        const formatDateTime = (date: Date) => {
            return date.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
            });
        };

        const getPresetDate = (type: 'today' | 'tomorrow' | 'nextWeek') => {
            const date = new Date();
            date.setHours(23, 59, 0, 0);

            if (type === 'tomorrow') {
                date.setDate(date.getDate() + 1);
            } else if (type === 'nextWeek') {
                date.setDate(date.getDate() + 7);
            }

            return date;
        };

        return (
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className={cn(
                            'w-full justify-start text-left font-normal',
                            !value && 'text-muted-foreground',
                            className
                        )}
                    >
                        <Calendar className="mr-2 h-4 w-4" />
                        {value ? formatDateTime(value) : placeholder}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-4 space-y-3">
                        {/* Quick Presets */}
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onChange(getPresetDate('today'))}
                                className="flex-1"
                            >
                                Today
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onChange(getPresetDate('tomorrow'))}
                                className="flex-1"
                            >
                                Tomorrow
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onChange(getPresetDate('nextWeek'))}
                                className="flex-1"
                            >
                                Next Week
                            </Button>
                        </div>

                        {/* Native datetime-local input */}
                        <Input
                            ref={ref}
                            type="datetime-local"
                            value={value ? new Date(value.getTime() - value.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                            onChange={(e) => {
                                const newDate = e.target.value ? new Date(e.target.value) : undefined;
                                onChange(newDate);
                            }}
                            className="w-full"
                        />

                        {value && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onChange(undefined)}
                                className="w-full"
                            >
                                Clear
                            </Button>
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        );
    }
);

DateTimePicker.displayName = 'DateTimePicker';

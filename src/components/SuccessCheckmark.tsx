import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface SuccessCheckmarkProps {
    show: boolean;
    message?: string;
}

export function SuccessCheckmark({ show, message = 'Saved!' }: SuccessCheckmarkProps) {
    if (!show) return null;

    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
                type: 'spring',
                stiffness: 260,
                damping: 20,
            }}
            className="fixed top-4 right-4 z-[9999] flex items-center gap-2 bg-success text-success-foreground px-4 py-2 rounded-full shadow-lg"
        >
            <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                    type: 'spring',
                    stiffness: 260,
                    damping: 15,
                    delay: 0.1,
                }}
            >
                <Check className="w-5 h-5" />
            </motion.div>
            <span className="font-medium">{message}</span>
        </motion.div>
    );
}

import { useSwipeable } from 'react-swipeable';
import { useState } from 'react';

interface UseSwipeToDeleteOptions {
    onDelete: () => void;
    threshold?: number;
}

export function useSwipeToDelete({ onDelete, threshold = 100 }: UseSwipeToDeleteOptions) {
    const [swiping, setSwiping] = useState(false);
    const [swipeDistance, setSwipeDistance] = useState(0);

    // Only enable on mobile (< 768px)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    const handlers = useSwipeable({
        onSwipeStart: () => {
            if (isMobile) {
                setSwiping(true);
            }
        },
        onSwiping: (eventData) => {
            if (isMobile && eventData.dir === 'Left') {
                setSwipeDistance(Math.abs(eventData.deltaX));
            }
        },
        onSwiped: (eventData) => {
            if (isMobile) {
                if (eventData.dir === 'Left' && Math.abs(eventData.deltaX) > threshold) {
                    onDelete();
                }
                setSwiping(false);
                setSwipeDistance(0);
            }
        },
        trackMouse: false, // CRITICAL: No swipe on desktop mouse!
        trackTouch: true,  // Only touch events
    });

    return {
        handlers: isMobile ? handlers : {}, // Empty handlers on desktop
        swiping,
        swipeDistance,
        isMobile,
    };
}

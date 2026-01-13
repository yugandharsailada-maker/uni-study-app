import { useEffect, useState } from 'react';

interface UsePullToRefreshOptions {
    onRefresh: () => Promise<void>;
    pullThreshold?: number;
}

export function usePullToRefresh({ onRefresh, pullThreshold = 80 }: UsePullToRefreshOptions) {
    const [isPulling, setIsPulling] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Only enable on mobile touch devices
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const isTouch = typeof window !== 'undefined' && 'ontouchstart' in window;

    useEffect(() => {
        // Only attach listeners on mobile touch devices
        if (!isMobile || !isTouch) return;

        let startY = 0;
        let currentY = 0;

        const handleTouchStart = (e: TouchEvent) => {
            // Only start if scrolled to top
            if (window.scrollY === 0) {
                startY = e.touches[0].clientY;
                setIsPulling(true);
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!isPulling) return;

            currentY = e.touches[0].clientY;
            const distance = currentY - startY;

            if (distance > 0) {
                setPullDistance(Math.min(distance, pullThreshold * 1.5));
            }
        };

        const handleTouchEnd = async () => {
            if (isPulling && pullDistance > pullThreshold) {
                setIsRefreshing(true);
                await onRefresh();
                setIsRefreshing(false);
            }
            setIsPulling(false);
            setPullDistance(0);
        };

        document.addEventListener('touchstart', handleTouchStart);
        document.addEventListener('touchmove', handleTouchMove);
        document.addEventListener('touchend', handleTouchEnd);

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isPulling, pullDistance, pullThreshold, isMobile, isTouch, onRefresh]);

    return {
        isPulling: isMobile ? isPulling : false,
        pullDistance: isMobile ? pullDistance : 0,
        isRefreshing: isMobile ? isRefreshing : false,
        isMobile,
    };
}

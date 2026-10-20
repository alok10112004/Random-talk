import { useRef, useState } from 'react';

export default function SwipeWrapper({
  children,
  onSwipeRight,
  enabled = true,
}) {
  const [dragX, setDragX] = useState(0);
  const [showIndicator, setShowIndicator] = useState(false);
  const startXRef = useRef(0);
  const startTimeRef = useRef(0);
  const isDraggingRef = useRef(false);

  const SCREEN_WIDTH = typeof window !== 'undefined' ? window.innerWidth : 400;
  const THRESHOLD = SCREEN_WIDTH * 0.3;

  const handleTouchStart = (e) => {
    if (!enabled) return;
    const touch = e.touches[0];
    startXRef.current = touch.clientX;
    startTimeRef.current = Date.now();
    isDraggingRef.current = true;
    setDragX(0);
    setShowIndicator(false);
  };

  const handleTouchMove = (e) => {
    if (!enabled || !isDraggingRef.current) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - startXRef.current;

    if (deltaX > 0) {
      setDragX(deltaX);
      setShowIndicator(deltaX > 30);
    }
  };

  const handleTouchEnd = (e) => {
    if (!enabled || !isDraggingRef.current) return;
    isDraggingRef.current = false;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startXRef.current;
    const deltaTime = Date.now() - startTimeRef.current;
    const velocity = deltaX / deltaTime;

    const shouldTrigger =
      deltaX > THRESHOLD || (velocity > 0.5 && deltaX > 80);

    if (shouldTrigger && deltaX > 0) {
      console.log('👉 Swipe right — NEXT');
      setDragX(SCREEN_WIDTH);
      setTimeout(() => {
        onSwipeRight?.();
        setDragX(0);
        setShowIndicator(false);
      }, 200);
    } else {
      setDragX(0);
      setShowIndicator(false);
    }
  };

  const opacity = Math.min(dragX / THRESHOLD, 1);

  return (
    <div
      className="swipe-wrapper"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
        touchAction: 'pan-y',
        flex: '1 1 0',
        display: 'flex',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          transform: `translateX(${dragX}px)`,
          transition: isDraggingRef.current ? 'none' : 'transform 0.2s ease',
        }}
      >
        {children}
      </div>

      {showIndicator && (
        <div className="swipe-indicator" style={{ opacity }}>
          <div className="swipe-indicator-icon">⏭</div>
          <div className="swipe-indicator-text">NEXT</div>
        </div>
      )}
    </div>
  );
}
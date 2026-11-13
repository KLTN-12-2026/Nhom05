import { useEffect, useRef, useState } from 'react';

const SIZE = 60;
const GAP = 12;
const THRESHOLD = 6;

const bounds = () => {
    const viewport = window.visualViewport;
    const left = viewport?.offsetLeft ?? 0;
    const top = viewport?.offsetTop ?? 0;
    const width = viewport?.width ?? window.innerWidth;
    const height = viewport?.height ?? window.innerHeight;
    return {
        left: left + Math.min(GAP, Math.max(0, (width - SIZE) / 2)),
        top: top + Math.min(GAP, Math.max(0, (height - SIZE) / 2)),
        right: left + Math.max(0, width - SIZE - GAP),
        bottom: top + Math.max(0, height - SIZE - GAP),
    };
};
const clamp = (value, min, max) => Math.max(min, Math.min(value, Math.max(min, max)));

export default function useFloatingBubble() {
    const [position, setPosition] = useState(() => {
        const area = bounds();
        return { x: area.right, y: area.bottom };
    });
    const [isDragging, setIsDragging] = useState(false);
    const gesture = useRef(null);
    const edge = useRef('right');
    const suppressClick = useRef(false);

    useEffect(() => {
        const resize = () => {
            gesture.current = null;
            setIsDragging(false);
            const area = bounds();
            setPosition(previous => ({
                x: area[edge.current],
                y: clamp(previous.y, area.top, area.bottom),
            }));
        };
        window.addEventListener('resize', resize);
        window.visualViewport?.addEventListener('resize', resize);
        window.visualViewport?.addEventListener('scroll', resize);
        return () => {
            window.removeEventListener('resize', resize);
            window.visualViewport?.removeEventListener('resize', resize);
            window.visualViewport?.removeEventListener('scroll', resize);
        };
    }, []);

    const finish = event => {
        const current = gesture.current;
        if (!current || current.id !== event.pointerId) return;
        gesture.current = null;
        setIsDragging(false);
        if (current.dragged) {
            suppressClick.current = true;
            const area = bounds();
            setPosition(previous => {
                edge.current = previous.x - area.left < area.right - previous.x ? 'left' : 'right';
                return { x: area[edge.current], y: clamp(previous.y, area.top, area.bottom) };
            });
        }
    };

    return {
        position,
        isDragging,
        edge: position.x < (bounds().left + bounds().right) / 2 ? 'left' : 'right',
        buttonProps: {
            onPointerDown: event => {
                if (!event.isPrimary || event.button !== 0) return;
                // Read the rendered position so a new drag can interrupt a snap animation.
                const rect = event.currentTarget.getBoundingClientRect();
                suppressClick.current = false;
                gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, startX: rect.left, startY: rect.top, dragged: false };
                event.currentTarget.setPointerCapture(event.pointerId);
            },
            onPointerMove: event => {
                const current = gesture.current;
                if (!current || current.id !== event.pointerId) return;
                const dx = event.clientX - current.x;
                const dy = event.clientY - current.y;
                if (!current.dragged && Math.hypot(dx, dy) < THRESHOLD) return;
                current.dragged = true;
                setIsDragging(true);
                const area = bounds();
                setPosition({ x: clamp(current.startX + dx, area.left, area.right), y: clamp(current.startY + dy, area.top, area.bottom) });
            },
            onPointerUp: finish,
            onPointerCancel: finish,
            onLostPointerCapture: finish,
            onClickCapture: event => {
                if (event.detail !== 0 && suppressClick.current) {
                    event.preventDefault();
                    event.stopPropagation();
                    suppressClick.current = false;
                }
            },
            onDragStart: event => event.preventDefault(),
        },
    };
}

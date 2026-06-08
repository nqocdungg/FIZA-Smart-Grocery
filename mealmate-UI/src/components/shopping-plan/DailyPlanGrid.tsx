import type { DailyPlanCardData } from '@/features/shopping-plan/shopping';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import DailyPlanCard from './DailyPlanCard';
import './DailyPlanGrid.css';

interface DailyPlanGridProps {
    plans: DailyPlanCardData[];
    activeDate?: string; // Ngày đang được chọn (để truyền vào isActive của Card)
    onCardClick?: (date: string) => void;
}

const DailyPlanGrid: React.FC<DailyPlanGridProps> = ({ plans, activeDate, onCardClick }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const dragState = useRef({ isDragging: false, hasMoved: false, startX: 0, scrollLeft: 0 });
    const rafRef = useRef<number | null>(null);
    const lastDragEndAt = useRef(0);
    const [centerIndex, setCenterIndex] = useState(0);
    const [edgeHover, setEdgeHover] = useState<'left' | 'right' | null>(null);
    const [edgeCardIndex, setEdgeCardIndex] = useState<number | null>(null);
    const noteRotations = [-2.4, 1.8, -1.2, 2.2, -1.7, 1.3, -2.0, 2.5];

    const updateFocusState = useCallback(() => {
        const scroller = scrollRef.current;
        if (!scroller) return;

        const scrollerRect = scroller.getBoundingClientRect();
        const scrollerCenter = scrollerRect.left + scrollerRect.width / 2;
        const cardShells = Array.from(scroller.querySelectorAll<HTMLElement>('.daily-plan-card-shell'));

        let nearestCenterIndex = 0;
        let nearestCenterDistance = Number.POSITIVE_INFINITY;
        let leftCandidate = { index: 0, distance: Number.POSITIVE_INFINITY };
        let rightCandidate = { index: cardShells.length - 1, distance: Number.POSITIVE_INFINITY };

        cardShells.forEach((shell, index) => {
            const rect = shell.getBoundingClientRect();
            const cardCenter = rect.left + rect.width / 2;
            const centerDistance = Math.abs(cardCenter - scrollerCenter);
            const normalizedDistance = Math.min(centerDistance / Math.max(scrollerRect.width / 2, 1), 1);
            const scale = 1.06 - normalizedDistance * 0.14;

            shell.style.setProperty('--focus-scale', scale.toFixed(3));

            if (centerDistance < nearestCenterDistance) {
                nearestCenterDistance = centerDistance;
                nearestCenterIndex = index;
            }

            if (rect.right > scrollerRect.left && rect.left < scrollerRect.left + 120) {
                const distance = Math.abs(rect.left - scrollerRect.left);
                if (distance < leftCandidate.distance) {
                    leftCandidate = { index, distance };
                }
            }

            if (rect.left < scrollerRect.right && rect.right > scrollerRect.right - 120) {
                const distance = Math.abs(scrollerRect.right - rect.right);
                if (distance < rightCandidate.distance) {
                    rightCandidate = { index, distance };
                }
            }
        });

        setCenterIndex(nearestCenterIndex);

        if (edgeHover === 'left') {
            setEdgeCardIndex(leftCandidate.index);
        } else if (edgeHover === 'right') {
            setEdgeCardIndex(rightCandidate.index);
        } else {
            setEdgeCardIndex(null);
        }
    }, [edgeHover]);

    const scheduleFocusUpdate = useCallback(() => {
        if (rafRef.current !== null) return;
        rafRef.current = window.requestAnimationFrame(() => {
            rafRef.current = null;
            updateFocusState();
        });
    }, [updateFocusState]);

    useEffect(() => {
        updateFocusState();
        window.addEventListener('resize', scheduleFocusUpdate);

        return () => {
            window.removeEventListener('resize', scheduleFocusUpdate);
            if (rafRef.current !== null) {
                window.cancelAnimationFrame(rafRef.current);
            }
        };
    }, [plans, activeDate, updateFocusState, scheduleFocusUpdate]);

    useEffect(() => {
        if (!activeDate || plans.length === 0) return;
        const activeIndex = plans.findIndex(p => p.plannedDate === activeDate);
        if (activeIndex === -1) return;

        const scroller = scrollRef.current;
        if (!scroller) return;

        // Tự động cuộn lướt tới card đang active
        const cardShells = scroller.querySelectorAll<HTMLElement>('.daily-plan-card-shell');
        const targetShell = cardShells[activeIndex];
        if (!targetShell) return;

        const scrollerWidth = scroller.clientWidth;
        const targetLeft = targetShell.offsetLeft;
        const targetWidth = targetShell.offsetWidth;

        const newScrollLeft = targetLeft - (scrollerWidth / 2) + (targetWidth / 2);

        scroller.scrollTo({
            left: newScrollLeft,
            behavior: 'smooth'
        });
    }, [activeDate, plans]);

    const scrollByCard = (direction: 'left' | 'right') => {
        const scroller = scrollRef.current;
        if (!scroller) return;

        const cardWidth = scroller.querySelector<HTMLElement>('.daily-plan-card-shell')?.offsetWidth ?? 320;
        scroller.scrollBy({
            left: direction === 'left' ? -(cardWidth + 28) : cardWidth + 28,
            behavior: 'smooth',
        });
    };

    const handleWheel: React.WheelEventHandler<HTMLDivElement> = (event) => {
        const scroller = scrollRef.current;
        if (!scroller) return;

        const horizontalDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
        if (horizontalDelta === 0) return;

        event.preventDefault();
        scroller.scrollBy({ left: horizontalDelta, behavior: 'smooth' });
    };

    const handlePointerDown: React.PointerEventHandler<HTMLDivElement> = (event) => {
        const scroller = scrollRef.current;
        if (!scroller) return;

        dragState.current = {
            isDragging: true,
            hasMoved: false,
            startX: event.clientX,
            scrollLeft: scroller.scrollLeft,
        };
    };

    const handlePointerMove: React.PointerEventHandler<HTMLDivElement> = (event) => {
        const scroller = scrollRef.current;
        if (!scroller || !dragState.current.isDragging) return;

        const dragDistance = event.clientX - dragState.current.startX;
        if (Math.abs(dragDistance) > 6) {
            dragState.current.hasMoved = true;
            if (!scroller.hasPointerCapture(event.pointerId)) {
                scroller.setPointerCapture(event.pointerId);
            }
            scroller.classList.add('is-dragging');
        }

        if (!dragState.current.hasMoved) return;

        scroller.scrollLeft = dragState.current.scrollLeft - dragDistance;
    };

    const stopDragging: React.PointerEventHandler<HTMLDivElement> = (event) => {
        const scroller = scrollRef.current;
        if (!scroller) return;

        if (dragState.current.hasMoved) {
            lastDragEndAt.current = Date.now();
        }
        dragState.current.isDragging = false;
        dragState.current.hasMoved = false;
        if (scroller.hasPointerCapture(event.pointerId)) {
            scroller.releasePointerCapture(event.pointerId);
        }
        scroller.classList.remove('is-dragging');
    };

    const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = (event) => {
        const scroller = scrollRef.current;
        if (!scroller) return;

        const rect = scroller.getBoundingClientRect();
        const edgeSize = Math.min(120, rect.width * 0.18);

        if (event.clientX - rect.left < edgeSize && scroller.scrollLeft > 4) {
            setEdgeHover('left');
            return;
        }

        if (rect.right - event.clientX < edgeSize && scroller.scrollLeft < scroller.scrollWidth - scroller.clientWidth - 4) {
            setEdgeHover('right');
            return;
        }

        setEdgeHover(null);
    };

    return (
        <div className="daily-plan-board">
            <button
                className="daily-plan-nav daily-plan-nav-left"
                type="button"
                aria-label="Cuộn sang trái"
                onClick={() => scrollByCard('left')}
            >
                <ChevronLeft size={24} />
            </button>

            <div
                ref={scrollRef}
                className={`daily-plan-scroll-wrapper ${edgeHover ? `edge-hover-${edgeHover}` : ''}`}
                onScroll={scheduleFocusUpdate}
                onWheel={handleWheel}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={stopDragging}
                onPointerCancel={stopDragging}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setEdgeHover(null)}
            >
                <div className="daily-plan-grid-container">
                    {plans.map((plan, index) => (
                        <div
                            key={plan.plannedDate}
                            className={[
                                'daily-plan-card-shell',
                                centerIndex === index ? 'is-centered' : '',
                                edgeCardIndex === index ? 'is-edge-affordance' : '',
                            ].filter(Boolean).join(' ')}
                            style={{ '--note-rotation': `${noteRotations[index % noteRotations.length]}deg` } as React.CSSProperties}
                        >
                            <DailyPlanCard
                                data={plan}
                                isActive={plan.plannedDate === activeDate}
                                onClick={() => {
                                    if (Date.now() - lastDragEndAt.current < 180) {
                                        return;
                                    }
                                    onCardClick?.(plan.plannedDate);
                                }}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <button
                className="daily-plan-nav daily-plan-nav-right"
                type="button"
                aria-label="Cuộn sang phải"
                onClick={() => scrollByCard('right')}
            >
                <ChevronRight size={24} />
            </button>
        </div>
    );
};

export default DailyPlanGrid;

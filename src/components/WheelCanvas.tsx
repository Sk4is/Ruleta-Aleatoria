import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Participant } from '../types';
import { getSegmentColor } from '../utils/colors';
import { soundFx } from '../utils/audio';
import { Sparkles } from 'lucide-react';

interface WheelCanvasProps {
  participants: Participant[];
  isSpinning: boolean;
  onSpinStart: () => void;
  onSpinComplete: (winner: Participant) => void;
  winnerToSelect?: { winner: Participant; index: number } | null;
  disabled?: boolean;
  isResultShowing?: boolean;
}

export const WheelCanvas: React.FC<WheelCanvasProps> = ({
  participants,
  isSpinning,
  onSpinStart,
  onSpinComplete,
  winnerToSelect,
  disabled = false,
  isResultShowing = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Continuous wheel rotation in radians
  const rotationRef = useRef<number>(0);
  const idleAnimRef = useRef<number | null>(null);
  const spinAnimRef = useRef<number | null>(null);
  const lastPegIndexRef = useRef<number>(-1);
  const pointerDeflectionRef = useRef<number>(0); // needle bounce in radians
  const isPausedAfterResultRef = useRef<boolean>(false);

  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [canvasSize, setCanvasSize] = useState<number>(440);

  // Active items (non-eliminated)
  const activeParticipants = participants.filter((p) => !p.eliminated);
  const count = activeParticipants.length;

  // Equal slice angles for all participants (no weights/probabilities)
  const sliceAngle = count > 0 ? (2 * Math.PI) / count : 0;

  // Slice start and end boundaries
  const sliceBounds = activeParticipants.map((participant, index) => ({
    start: index * sliceAngle,
    end: (index + 1) * sliceAngle,
    participant,
  }));

  // Pointer position at 12 o'clock (3*PI/2 = top)
  const POINTER_ANGLE = (3 * Math.PI) / 2;

  // Responsive canvas size with ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        // Keep wheel square, between 280px and 520px
        const size = Math.min(520, Math.max(280, Math.floor(width)));
        setCanvasSize(size);
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Draw wheel on HTML5 canvas
  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = canvasSize;
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    ctx.save();
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 18; // Margin for pointer and outer rim
    const rotation = rotationRef.current;

    ctx.clearRect(0, 0, size, size);

    if (activeParticipants.length === 0) {
      // Empty wheel state in Spanish
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#f8fafc';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#e2e8f0';
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '600 16px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('No hay participantes', centerX, centerY - 10);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 13px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Añade nombres para empezar', centerX, centerY + 14);
      ctx.restore();
      return;
    }

    // Wheel drop shadow
    ctx.save();
    ctx.shadowColor = 'rgba(15, 23, 42, 0.08)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 10;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 2, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();

    // Outer rim border
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 4, 0, Math.PI * 2);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#f1f5f9';
    ctx.stroke();

    // Draw Slices
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);

    sliceBounds.forEach((slice, idx) => {
      const isWinner = highlightedIndex === idx;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, slice.start, slice.end);
      ctx.closePath();

      // Segment color
      const baseColor = slice.participant.color || getSegmentColor(idx);
      ctx.fillStyle = baseColor;
      ctx.fill();

      // Inner divider line
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Winner highlight overlay
      if (isWinner) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.38)';
        ctx.fill();
      }

      // Slice label text
      ctx.save();
      const midAngle = slice.start + (slice.end - slice.start) / 2;
      ctx.rotate(midAngle);

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      // Dynamic font size scaling
      const fontSize = Math.max(
        11,
        Math.min(17, Math.floor(radius * 0.1 * Math.min(1, sliceAngle * 2.2)))
      );
      ctx.font = `600 ${fontSize}px "Plus Jakarta Sans", sans-serif`;

      // Text shadow for high legibility
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 4;

      // Text clipping and max length
      const textRadius = radius - 24;
      const maxTextWidth = radius * 0.65;
      let label = slice.participant.name;

      while (ctx.measureText(label).width > maxTextWidth && label.length > 3) {
        label = label.slice(0, -2) + '…';
      }

      ctx.fillText(label, textRadius, 0);
      ctx.restore();
    });

    // Outer rim pegs
    sliceBounds.forEach((slice) => {
      const pegAngle = slice.start;
      const pegX = Math.cos(pegAngle) * (radius - 2);
      const pegY = Math.sin(pegAngle) * (radius - 2);

      ctx.beginPath();
      ctx.arc(pegX, pegY, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#94a3b8';
      ctx.stroke();
    });

    ctx.restore(); // Restore from translate & rotate

    // Center Hub Button
    const hubRadius = Math.max(34, radius * 0.22);
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, hubRadius + 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;
    ctx.fill();

    // Inner center ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, hubRadius - 2, 0, Math.PI * 2);
    ctx.fillStyle = isSpinning ? '#e2e8f0' : '#4f46e5';
    ctx.fill();

    // Center Hub Text: "GIRAR" / "..."
    ctx.fillStyle = isSpinning ? '#64748b' : '#ffffff';
    ctx.font = `700 ${Math.max(12, Math.floor(hubRadius * 0.42))}px "Outfit", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'transparent';
    ctx.fillText(isSpinning ? '...' : 'GIRAR', centerX, centerY);
    ctx.restore();

    // Top Pointer Indicator (at 12 o'clock)
    ctx.save();
    const pointerTopY = 4;
    const pointerWidth = 20;
    const pointerLength = 26;

    // Pointer needle with deflection bounce
    ctx.translate(centerX, pointerTopY);
    ctx.rotate(pointerDeflectionRef.current);

    // Drop shadow on pointer
    ctx.shadowColor = 'rgba(15, 23, 42, 0.2)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;

    ctx.beginPath();
    ctx.moveTo(-pointerWidth / 2, 0);
    ctx.lineTo(pointerWidth / 2, 0);
    ctx.lineTo(0, pointerLength);
    ctx.closePath();

    ctx.fillStyle = '#1e1b4b'; // Deep near-black indigo
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Pointer pivot pin dot
    ctx.beginPath();
    ctx.arc(0, 3, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.restore();
    ctx.restore();
  }, [canvasSize, activeParticipants.length, sliceBounds, highlightedIndex, isSpinning, sliceAngle]);

  // Initial draw
  useEffect(() => {
    drawWheel();
  }, [drawWheel]);

  // Clean up any spin or highlight when participants list becomes empty
  useEffect(() => {
    if (activeParticipants.length === 0) {
      setHighlightedIndex(null);
      if (spinAnimRef.current) {
        cancelAnimationFrame(spinAnimRef.current);
        spinAnimRef.current = null;
      }
      if (idleAnimRef.current) {
        cancelAnimationFrame(idleAnimRef.current);
        idleAnimRef.current = null;
      }
      pointerDeflectionRef.current = 0;
      drawWheel();
    }
  }, [activeParticipants.length, drawWheel]);

  // 1. DEFAULT IDLE CONTINUOUS ROTATION
  // The wheel rotates continuously and gently at a very slow speed when idle.
  // It never selects winners, never makes tick sounds, and keeps the pointer stationary.
  useEffect(() => {
    if (isSpinning || isResultShowing || activeParticipants.length === 0) {
      if (idleAnimRef.current) {
        cancelAnimationFrame(idleAnimRef.current);
        idleAnimRef.current = null;
      }
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      pointerDeflectionRef.current = 0;
      drawWheel();
      return;
    }

    // Slow ambient rotation speed (~0.22 rad/sec = 1 full turn every ~28s)
    const IDLE_SPEED = 0.00022;
    let lastTimestamp = performance.now();

    const loopIdle = (now: number) => {
      // If momentarily paused after a result landing, hold stationary
      if (isPausedAfterResultRef.current) {
        lastTimestamp = now;
        idleAnimRef.current = requestAnimationFrame(loopIdle);
        return;
      }

      const dt = Math.min(80, now - lastTimestamp);
      lastTimestamp = now;

      // Update rotation smoothly without jumping
      rotationRef.current = (rotationRef.current + IDLE_SPEED * dt) % (2 * Math.PI);
      pointerDeflectionRef.current = 0; // Pointer stays calm and stationary during idle
      drawWheel();

      idleAnimRef.current = requestAnimationFrame(loopIdle);
    };

    idleAnimRef.current = requestAnimationFrame(loopIdle);

    return () => {
      if (idleAnimRef.current) {
        cancelAnimationFrame(idleAnimRef.current);
        idleAnimRef.current = null;
      }
    };
  }, [isSpinning, isResultShowing, activeParticipants.length, drawWheel]);

  // 2. TRIGGER REAL SPIN: TRANSITION FROM IDLE ROTATION
  // Seamlessly accelerates from the wheel's current idle rotation angle into a full physical spin,
  // then smoothly decelerates and lands precisely on the winner chosen by crypto.getRandomValues().
  useEffect(() => {
    if (!isSpinning || !winnerToSelect) {
      return;
    }

    // Stop idle loop
    if (idleAnimRef.current) {
      cancelAnimationFrame(idleAnimRef.current);
      idleAnimRef.current = null;
    }

    setHighlightedIndex(null);

    const winnerIndex = winnerToSelect.index;
    const targetSlice = sliceBounds[winnerIndex];
    if (!targetSlice) return;

    // Center of winning slice with natural jitter
    const sliceWidth = targetSlice.end - targetSlice.start;
    const randomOffset = (Math.random() - 0.5) * sliceWidth * 0.55;
    const targetSliceAngle = targetSlice.start + sliceWidth / 2 + randomOffset;

    // Start rotation from exact current angle
    const startRotation = rotationRef.current;

    // Pointer is at POINTER_ANGLE (12 o'clock).
    // When wheel rotates by R, targetSliceAngle is at (targetSliceAngle + R) % 2PI.
    // To align: finalRotation = POINTER_ANGLE - targetSliceAngle + 2*PI*k.
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fullSpins = prefersReducedMotion ? 2 : 5 + Math.floor(Math.random() * 2); // 5 to 6 full spins
    let finalRotation = POINTER_ANGLE - targetSliceAngle;
    while (finalRotation <= startRotation + fullSpins * 2 * Math.PI) {
      finalRotation += 2 * Math.PI;
    }

    const totalDistance = finalRotation - startRotation;
    const duration = prefersReducedMotion ? 1600 : 3900; // ~3.9s: exciting yet prompt
    const startTime = performance.now();

    // Normalized physics model:
    // Initial velocity matching idle speed (so rotation accelerates seamlessly without any visual jump)
    const idleRadPerSec = prefersReducedMotion ? 0 : 0.22;
    const v0 = idleRadPerSec * (duration / 1000); // normalized initial velocity
    const sa = 0.18; // peak velocity reached at 18% of spin duration (~700ms)
    const k = 5; // quintic friction decay for authentic deceleration

    // vmax calculated so integral from 0 to 1 equals totalDistance:
    const vmax = (totalDistance - 0.5 * sa * v0) / (0.5 * sa + (1 - sa) / (k + 1));
    const D1 = 0.5 * sa * (v0 + vmax);

    lastPegIndexRef.current = -1;

    const animateSpin = (now: number) => {
      const elapsed = now - startTime;
      const s = Math.min(1, elapsed / duration); // normalized time [0, 1]

      let distanceTraveled = 0;
      let currentVelocityNormalized = 0;

      if (s <= sa) {
        // Smooth Hermite acceleration phase: smoothly ramps up from v0 to vmax
        const u = s / sa;
        distanceTraveled = v0 * s + (vmax - v0) * sa * (Math.pow(u, 3) - 0.5 * Math.pow(u, 4));
        currentVelocityNormalized = v0 + (vmax - v0) * (3 * u * u - 2 * Math.pow(u, 3));
      } else {
        // Quintic mechanical deceleration phase: friction smoothly slows wheel to stop
        const decayFactor = (1 - s) / (1 - sa);
        distanceTraveled =
          D1 + (vmax * (1 - sa)) / (k + 1) * (1 - Math.pow(decayFactor, k + 1));
        currentVelocityNormalized = vmax * Math.pow(decayFactor, k);
      }

      const currentRotation = startRotation + distanceTraveled;
      rotationRef.current = currentRotation;

      // Calculate instantaneous angular speed in radians per second
      const angularSpeed = currentVelocityNormalized / (duration / 1000);

      // Peg detection under top pointer for audio tick and needle bounce
      const angleAtPointer =
        (POINTER_ANGLE - (currentRotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const currentPegSlice = Math.floor(angleAtPointer / sliceAngle) % count;

      if (currentPegSlice !== lastPegIndexRef.current) {
        lastPegIndexRef.current = currentPegSlice;
        // Pitch scales naturally with rotation speed
        soundFx.playTick(Math.min(1.35, 0.75 + angularSpeed * 0.04));
        // Pointer deflects backward when struck by a peg
        pointerDeflectionRef.current = -0.22 * Math.min(1, angularSpeed / 10);
      } else {
        // Spring return needle to center
        pointerDeflectionRef.current *= 0.85;
      }

      drawWheel();

      if (s < 1) {
        spinAnimRef.current = requestAnimationFrame(animateSpin);
      } else {
        // Finished spinning: perfectly landed on winner
        rotationRef.current = finalRotation % (2 * Math.PI);
        pointerDeflectionRef.current = 0;
        setHighlightedIndex(winnerIndex);
        soundFx.playVictory();
        drawWheel();

        // Pause briefly on winning segment before resuming ambient rotation
        isPausedAfterResultRef.current = true;
        setTimeout(() => {
          isPausedAfterResultRef.current = false;
        }, 1600);

        onSpinComplete(winnerToSelect.winner);
      }
    };

    spinAnimRef.current = requestAnimationFrame(animateSpin);

    return () => {
      if (spinAnimRef.current) {
        cancelAnimationFrame(spinAnimRef.current);
        spinAnimRef.current = null;
      }
    };
  }, [isSpinning, winnerToSelect, count, sliceAngle, sliceBounds, POINTER_ANGLE, onSpinComplete, drawWheel]);

  // Handle single click / tap to spin
  const handleTriggerSpin = () => {
    if (isSpinning || disabled || activeParticipants.length === 0) return;
    onSpinStart();
  };

  return (
    <div
      ref={containerRef}
      id="wheel-wrapper"
      className="relative flex flex-col items-center justify-center w-full max-w-[520px] mx-auto select-none"
    >
      {/* Interactive wheel circle (click / tap anywhere on wheel to spin) */}
      <div
        id="wheel-interactive-area"
        onClick={handleTriggerSpin}
        role="button"
        tabIndex={activeParticipants.length > 0 ? 0 : -1}
        aria-label={activeParticipants.length > 0 ? 'Girar la ruleta' : 'Ruleta vacía'}
        onKeyDown={(e) => {
          if (
            (e.key === 'Enter' || e.key === ' ') &&
            !isSpinning &&
            !disabled &&
            activeParticipants.length > 0
          ) {
            e.preventDefault();
            handleTriggerSpin();
          }
        }}
        className={`relative ${
          activeParticipants.length > 0
            ? 'cursor-pointer active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300'
            : 'cursor-default'
        } transition-transform duration-200 rounded-full`}
      >
        <canvas
          ref={canvasRef}
          id="wheel-canvas"
          className="block"
          style={{ width: `${canvasSize}px`, height: `${canvasSize}px` }}
        />
      </div>

      {/* Simple, Intuitive Primary Spin Button */}
      <div className="mt-5 w-full max-w-[280px] flex flex-col items-center">
        <button
          id="spin-main-button"
          type="button"
          disabled={isSpinning || disabled || activeParticipants.length === 0}
          onClick={handleTriggerSpin}
          className="w-full py-3.5 sm:py-4 px-8 rounded-2xl font-bold text-lg sm:text-xl tracking-wider shadow-md transition-all duration-150 flex items-center justify-center gap-2.5 cursor-pointer select-none bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:bg-neutral-200 disabled:text-neutral-500 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
        >
          {isSpinning ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-neutral-400/40 border-t-neutral-600 rounded-full animate-spin" />
              <span>GIRANDO...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-amber-300 fill-amber-300" />
              <span>GIRAR</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

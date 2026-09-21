import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Pipette, X, Check, GripHorizontal } from 'lucide-react';
import type { HSV } from '../../utils/color';
import {
  parseColor,
  formatColor,
  rgbaToHex,
  rgbaToHsv,
  hsvToRgba,
  clamp,
} from '../../utils/color';
import { useDocument } from '../../document/documentContext';

interface ColorPickerProps {
  label?: string;
  value: string;
  onChange: (newColor: string) => void;
  className?: string;
}

const PRESET_PALETTE = [
  '#ffffff', '#f8fafc', '#94a3b8', '#475569', '#1e293b', '#000000',
  '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6',
  '#6366f1', '#8b5cf6', '#d946ef', '#ec4899',
];

// Helper to compute coordinates immediately outside the layer setting panel
const computePopoverPosition = (el: HTMLElement) => {
  const rect = el.getBoundingClientRect();
  const popoverWidth = 260;
  const popoverHeight = 440;

  const screenW = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const screenH = typeof window !== 'undefined' ? window.innerHeight : 800;

  // By default, place popup outside the layer setting panel to the left
  let left = rect.left - popoverWidth - 12;
  let top = rect.top - 8;

  // If there is not enough room to the left of the panel (e.g. narrow screen or mobile)
  if (left < 12) {
    if (rect.right + popoverWidth + 12 <= screenW) {
      // Place to the right of trigger
      left = rect.right + 12;
    } else {
      // Center or clamp to screen
      left = Math.max(12, Math.min(screenW - popoverWidth - 12, (screenW - popoverWidth) / 2));
    }
  }

  // Vertical clamping so popup is never cut off
  if (top + popoverHeight > screenH - 12) {
    top = Math.max(12, screenH - popoverHeight - 12);
  }
  if (top < 12) {
    top = 12;
  }

  return { left, top };
};

export const ColorPicker: React.FC<ColorPickerProps> = ({
  label,
  value,
  onChange,
  className = '',
}) => {
  const { document: pixoraDoc } = useDocument();
  const [isOpen, setIsOpen] = useState(false);
  const [colorMode, setColorMode] = useState<'hex' | 'rgba'>('hex');
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);

  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const satValRef = useRef<HTMLDivElement>(null);
  const hueTrackRef = useRef<HTMLDivElement>(null);
  const alphaTrackRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const hasUserMovedRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // Parse incoming value to RGBA & HSV
  const currentRgba = useMemo(() => parseColor(value), [value]);
  const [hsv, setHsv] = useState<HSV>(() => rgbaToHsv(currentRgba.r, currentRgba.g, currentRgba.b, currentRgba.a));

  // Sync internal HSV when incoming value changes from outside
  useEffect(() => {
    const parsed = parseColor(value);
    const newHsv = rgbaToHsv(parsed.r, parsed.g, parsed.b, parsed.a);
    setHsv(prev => {
      // Preserve Hue if saturation or brightness is 0 to avoid snapping back to red
      if (newHsv.s === 0 || newHsv.v === 0) {
        return { ...newHsv, h: prev.h };
      }
      return newHsv;
    });
  }, [value]);

  // Close on outside pointerdown or Escape
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const openPopover = useCallback(() => {
    hasUserMovedRef.current = false;
    if (triggerRef.current) {
      const pos = computePopoverPosition(triggerRef.current);
      setPopoverPos(pos);
    }
    setIsOpen(true);
  }, []);

  const togglePopover = useCallback(() => {
    if (isOpen) {
      setIsOpen(false);
    } else {
      openPopover();
    }
  }, [isOpen, openPopover]);

  // Synchronously position before paint and track container scroll
  const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

  useIsomorphicLayoutEffect(() => {
    if (!isOpen) return;

    if (triggerRef.current && !hasUserMovedRef.current) {
      setPopoverPos(computePopoverPosition(triggerRef.current));
    }

    const handleScroll = () => {
      if (!hasUserMovedRef.current && triggerRef.current) {
        setPopoverPos(computePopoverPosition(triggerRef.current));
      }
    };

    const handleResize = () => {
      if (!hasUserMovedRef.current && triggerRef.current) {
        setPopoverPos(computePopoverPosition(triggerRef.current));
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  // Drag popover by header across canvas
  const handleHeaderPointerDown = (e: React.PointerEvent) => {
    if (!popoverPos || (e.target as HTMLElement).closest('button')) return;
    isDraggingRef.current = true;
    hasUserMovedRef.current = true;
    dragOffsetRef.current = {
      x: e.clientX - popoverPos.left,
      y: e.clientY - popoverPos.top,
    };

    const onPointerMove = (ev: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const newLeft = clamp(ev.clientX - dragOffsetRef.current.x, 8, window.innerWidth - 268);
      const newTop = clamp(ev.clientY - dragOffsetRef.current.y, 8, window.innerHeight - 80);
      setPopoverPos({ left: newLeft, top: newTop });
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Emit color update
  const emitColorChange = useCallback(
    (newHsv: HSV) => {
      const rgba = hsvToRgba(newHsv.h, newHsv.s, newHsv.v, newHsv.a);
      const formatted = formatColor(rgba);
      onChange(formatted);
    },
    [onChange]
  );

  // Saturation / Value dragging
  const handleSatValPointerDown = (e: React.PointerEvent) => {
    if (!satValRef.current) return;
    satValRef.current.setPointerCapture(e.pointerId);

    const updateSatVal = (clientX: number, clientY: number) => {
      if (!satValRef.current) return;
      const rect = satValRef.current.getBoundingClientRect();
      const s = clamp(Math.round(((clientX - rect.left) / rect.width) * 100), 0, 100);
      const v = clamp(Math.round((1 - (clientY - rect.top) / rect.height) * 100), 0, 100);

      const nextHsv = { ...hsv, s, v };
      setHsv(nextHsv);
      emitColorChange(nextHsv);
    };

    updateSatVal(e.clientX, e.clientY);

    const onPointerMove = (ev: PointerEvent) => updateSatVal(ev.clientX, ev.clientY);
    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Hue slider dragging
  const handleHuePointerDown = (e: React.PointerEvent) => {
    if (!hueTrackRef.current) return;
    hueTrackRef.current.setPointerCapture(e.pointerId);

    const updateHue = (clientX: number) => {
      if (!hueTrackRef.current) return;
      const rect = hueTrackRef.current.getBoundingClientRect();
      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
      const h = Math.round(ratio * 360);

      const nextHsv = { ...hsv, h: h >= 360 ? 0 : h };
      setHsv(nextHsv);
      emitColorChange(nextHsv);
    };

    updateHue(e.clientX);

    const onPointerMove = (ev: PointerEvent) => updateHue(ev.clientX);
    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Alpha slider dragging
  const handleAlphaPointerDown = (e: React.PointerEvent) => {
    if (!alphaTrackRef.current) return;
    alphaTrackRef.current.setPointerCapture(e.pointerId);

    const updateAlpha = (clientX: number) => {
      if (!alphaTrackRef.current) return;
      const rect = alphaTrackRef.current.getBoundingClientRect();
      const a = Number(clamp((clientX - rect.left) / rect.width, 0, 1).toFixed(2));

      const nextHsv = { ...hsv, a };
      setHsv(nextHsv);
      emitColorChange(nextHsv);
    };

    updateAlpha(e.clientX);

    const onPointerMove = (ev: PointerEvent) => updateAlpha(ev.clientX);
    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Eyedropper integration
  const handleEyeDropper = async () => {
    if (typeof window !== 'undefined' && 'EyeDropper' in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          const parsed = parseColor(result.sRGBHex);
          const nextHsv = rgbaToHsv(parsed.r, parsed.g, parsed.b, 1);
          setHsv(nextHsv);
          emitColorChange(nextHsv);
        }
      } catch {
        // User cancelled eyedropper
      }
    }
  };

  // Extract unique colors from current project document
  const documentColors = useMemo(() => {
    const colors = new Set<string>();
    for (const obj of Object.values(pixoraDoc.objects)) {
      if ((obj as any).fill && typeof (obj as any).fill === 'string') {
        colors.add((obj as any).fill);
      }
      if ((obj as any).stroke && typeof (obj as any).stroke === 'string') {
        colors.add((obj as any).stroke);
      }
      if ((obj as any).color && typeof (obj as any).color === 'string') {
        colors.add((obj as any).color);
      }
    }
    return Array.from(colors).slice(0, 12);
  }, [pixoraDoc.objects]);

  const hexInputVal = rgbaToHex(currentRgba.r, currentRgba.g, currentRgba.b);
  const opacityPercent = Math.round(currentRgba.a * 100);

  // Pure hue background color for 2D picker
  const pureHueColor = `hsl(${hsv.h}, 100%, 50%)`;
  const solidCurrentColor = `rgb(${currentRgba.r}, ${currentRgba.g}, ${currentRgba.b})`;

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button: Swatch + Hex Input */}
      <div
        ref={triggerRef}
        className="flex items-center space-x-2 bg-pixora-elevated px-2 py-1 rounded border border-pixora-border focus-within:border-pixora-selection transition-colors"
      >
        {/* Swatch Preview Button */}
        <button
          type="button"
          onClick={togglePopover}
          title="Open Color Picker"
          className="relative w-5 h-5 rounded overflow-hidden border border-white/20 shadow-inner shrink-0 cursor-pointer transition-transform hover:scale-105"
        >
          {/* Checkered pattern for transparency */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)',
              backgroundSize: '6px 6px',
              backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0px',
            }}
          />
          {/* Actual color */}
          <div className="absolute inset-0" style={{ backgroundColor: value }} />
        </button>

        {/* Hex Text Display */}
        <input
          type="text"
          value={hexInputVal}
          onChange={e => {
            const val = e.target.value;
            if (/^#[0-9A-Fa-f]{0,8}$/.test(val)) {
              if (val.length === 7 || val.length === 9) {
                onChange(val);
              }
            }
          }}
          onFocus={openPopover}
          className="bg-transparent text-pixora-text outline-none font-mono w-20 text-right uppercase text-xs"
        />

        {/* Alpha percentage badge */}
        <span className="text-[10px] text-pixora-text-dim font-mono">{opacityPercent}%</span>
      </div>

      {/* Floating Modern Color Picker Popover outside layer setting panel */}
      {isOpen &&
        popoverPos &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: 'fixed',
              top: `${popoverPos.top}px`,
              left: `${popoverPos.left}px`,
              width: '260px',
              zIndex: 9999,
            }}
            className="bg-[#1e1e1e] border border-[#333] rounded-xl shadow-2xl p-3 text-xs select-none animate-in fade-in zoom-in-95 duration-100"
          >
            {/* Draggable Header */}
            <div
              onPointerDown={handleHeaderPointerDown}
              className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 cursor-grab active:cursor-grabbing"
              title="Drag to move color picker"
            >
              <div className="flex items-center space-x-1.5 pointer-events-none">
                <GripHorizontal size={13} className="text-gray-500" />
                <span className="font-semibold text-white tracking-wide text-[11px] uppercase">
                  {label || 'Color'}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                {typeof window !== 'undefined' && 'EyeDropper' in window && (
                  <button
                    type="button"
                    onClick={handleEyeDropper}
                    title="Sample screen color"
                    className="p-1 hover:text-white text-gray-400 hover:bg-white/10 rounded transition-colors cursor-pointer"
                  >
                    <Pipette size={13} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:text-white text-gray-400 hover:bg-white/10 rounded transition-colors cursor-pointer"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

          {/* 2D Saturation / Value Gradient Canvas Area */}
          <div
            ref={satValRef}
            onPointerDown={handleSatValPointerDown}
            className="relative w-full h-36 rounded-lg cursor-crosshair overflow-hidden touch-none shadow-inner"
            style={{ backgroundColor: pureHueColor }}
          >
            {/* White-to-transparent horizontal gradient */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to right, #ffffff, transparent)',
              }}
            />
            {/* Black-to-transparent vertical gradient */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to top, #000000, transparent)',
              }}
            />
            {/* Draggable Circle Handle */}
            <div
              className="absolute w-3.5 h-3.5 -ml-1.5 -mt-1.5 rounded-full border-2 border-white shadow-md pointer-events-none"
              style={{
                left: `${hsv.s}%`,
                top: `${100 - hsv.v}%`,
                backgroundColor: solidCurrentColor,
              }}
            />
          </div>

          {/* Sliders: Hue and Alpha */}
          <div className="mt-3 space-y-2.5">
            {/* Hue Slider */}
            <div
              ref={hueTrackRef}
              onPointerDown={handleHuePointerDown}
              className="relative w-full h-3 rounded-full cursor-pointer touch-none shadow-inner"
              style={{
                background:
                  'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
              }}
            >
              <div
                className="absolute top-1/2 -mt-2 -ml-2 w-4 h-4 rounded-full bg-white shadow border border-black/30 pointer-events-none"
                style={{ left: `${(hsv.h / 360) * 100}%` }}
              />
            </div>

            {/* Alpha Slider */}
            <div
              ref={alphaTrackRef}
              onPointerDown={handleAlphaPointerDown}
              className="relative w-full h-3 rounded-full cursor-pointer touch-none overflow-hidden shadow-inner"
            >
              {/* Checkered pattern background */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    'linear-gradient(45deg, #444 25%, transparent 25%), linear-gradient(-45deg, #444 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #444 75%), linear-gradient(-45deg, transparent 75%, #444 75%)',
                  backgroundSize: '6px 6px',
                  backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0px',
                }}
              />
              {/* Gradient from transparent to solid color */}
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to right, transparent, ${solidCurrentColor})`,
                }}
              />
              <div
                className="absolute top-1/2 -mt-2 -ml-2 w-4 h-4 rounded-full bg-white shadow border border-black/30 pointer-events-none"
                style={{ left: `${hsv.a * 100}%` }}
              />
            </div>
          </div>

          {/* Formats and Numerical Inputs */}
          <div className="mt-3 pt-2.5 border-t border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setColorMode(colorMode === 'hex' ? 'rgba' : 'hex')}
                className="text-[10px] uppercase font-bold tracking-wider text-gray-400 hover:text-white transition-colors flex items-center space-x-1"
              >
                <span>{colorMode.toUpperCase()}</span>
                <span className="text-[8px] opacity-60">⇄</span>
              </button>
              <div className="flex items-center space-x-1 text-gray-400 text-[11px] font-mono">
                <span>A:</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={opacityPercent}
                  onChange={e => {
                    const newA = clamp(Number(e.target.value) / 100, 0, 1);
                    const nextHsv = { ...hsv, a: newA };
                    setHsv(nextHsv);
                    emitColorChange(nextHsv);
                  }}
                  className="w-10 bg-[#2a2a2a] text-white text-right px-1 py-0.5 rounded border border-[#444] outline-none"
                />
                <span>%</span>
              </div>
            </div>

            {colorMode === 'hex' ? (
              <div className="flex items-center bg-[#2a2a2a] rounded border border-[#444] px-2 py-1 text-xs focus-within:border-pixora-selection">
                <span className="text-gray-500 font-mono select-none">#</span>
                <input
                  type="text"
                  value={hexInputVal.replace('#', '')}
                  onChange={e => {
                    const val = e.target.value.trim();
                    if (/^[0-9A-Fa-f]{0,8}$/.test(val)) {
                      if (val.length === 6 || val.length === 8) {
                        const parsed = parseColor(`#${val}`);
                        const nextHsv = rgbaToHsv(parsed.r, parsed.g, parsed.b, parsed.a);
                        setHsv(nextHsv);
                        emitColorChange(nextHsv);
                      }
                    }
                  }}
                  className="bg-transparent text-white font-mono uppercase text-xs outline-none w-full ml-1"
                />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1.5 text-xs font-mono">
                <div className="flex items-center bg-[#2a2a2a] rounded border border-[#444] px-1.5 py-1">
                  <span className="text-gray-500 text-[10px] mr-1">R</span>
                  <input
                    type="number"
                    min="0"
                    max="255"
                    value={currentRgba.r}
                    onChange={e => {
                      const r = clamp(Number(e.target.value), 0, 255);
                      const nextHsv = rgbaToHsv(r, currentRgba.g, currentRgba.b, hsv.a);
                      setHsv(nextHsv);
                      emitColorChange(nextHsv);
                    }}
                    className="bg-transparent text-white w-full outline-none text-right"
                  />
                </div>
                <div className="flex items-center bg-[#2a2a2a] rounded border border-[#444] px-1.5 py-1">
                  <span className="text-gray-500 text-[10px] mr-1">G</span>
                  <input
                    type="number"
                    min="0"
                    max="255"
                    value={currentRgba.g}
                    onChange={e => {
                      const g = clamp(Number(e.target.value), 0, 255);
                      const nextHsv = rgbaToHsv(currentRgba.r, g, currentRgba.b, hsv.a);
                      setHsv(nextHsv);
                      emitColorChange(nextHsv);
                    }}
                    className="bg-transparent text-white w-full outline-none text-right"
                  />
                </div>
                <div className="flex items-center bg-[#2a2a2a] rounded border border-[#444] px-1.5 py-1">
                  <span className="text-gray-500 text-[10px] mr-1">B</span>
                  <input
                    type="number"
                    min="0"
                    max="255"
                    value={currentRgba.b}
                    onChange={e => {
                      const b = clamp(Number(e.target.value), 0, 255);
                      const nextHsv = rgbaToHsv(currentRgba.r, currentRgba.g, b, hsv.a);
                      setHsv(nextHsv);
                      emitColorChange(nextHsv);
                    }}
                    className="bg-transparent text-white w-full outline-none text-right"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Palette Swatches */}
          <div className="mt-3 pt-2.5 border-t border-white/10 space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">
              Presets
            </span>
            <div className="grid grid-cols-8 gap-1.5">
              {PRESET_PALETTE.map(preset => (
                <button
                  key={preset}
                  onClick={() => {
                    const parsed = parseColor(preset);
                    const nextHsv = rgbaToHsv(parsed.r, parsed.g, parsed.b, hsv.a);
                    setHsv(nextHsv);
                    emitColorChange(nextHsv);
                  }}
                  title={preset}
                  style={{ backgroundColor: preset }}
                  className="w-5 h-5 rounded-md border border-white/10 hover:scale-110 hover:border-white/40 transition-transform shadow-sm flex items-center justify-center cursor-pointer"
                >
                  {preset.toLowerCase() === value.toLowerCase() && (
                    <Check size={11} className={preset === '#ffffff' ? 'text-black' : 'text-white'} />
                  )}
                </button>
              ))}
            </div>

            {/* Document Colors if available */}
            {documentColors.length > 0 && (
              <div className="pt-1.5 space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">
                  Document Colors
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {documentColors.map(docColor => (
                    <button
                      key={docColor}
                      onClick={() => {
                        const parsed = parseColor(docColor);
                        const nextHsv = rgbaToHsv(parsed.r, parsed.g, parsed.b, parsed.a);
                        setHsv(nextHsv);
                        emitColorChange(nextHsv);
                      }}
                      title={docColor}
                      style={{ backgroundColor: docColor }}
                      className="w-5 h-5 rounded-md border border-white/10 hover:scale-110 hover:border-white/40 transition-transform shadow-sm flex items-center justify-center cursor-pointer"
                    >
                      {docColor.toLowerCase() === value.toLowerCase() && (
                        <Check size={11} className="text-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

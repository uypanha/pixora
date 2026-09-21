import { DragHandle } from '../types/editor';
import { RectBounds } from '../utils/math';

interface SelectionBoxProps {
  bounds: RectBounds;
  rotation?: number;
  zoom: number;
  isSingleSelection: boolean;
  onHandlePointerDown: (handle: DragHandle, e: React.PointerEvent) => void;
  onRotatePointerDown: (e: React.PointerEvent) => void;
  onMovePointerDown: (e: React.PointerEvent) => void;
}

export const SelectionBox: React.FC<SelectionBoxProps> = ({
  bounds,
  rotation = 0,
  zoom,
  isSingleSelection,
  onHandlePointerDown,
  onRotatePointerDown,
  onMovePointerDown,
}) => {
  const { x, y, width, height } = bounds;
  const cx = x + width / 2;
  const cy = y + height / 2;

  // Visual handle size
  const visualSize = Math.max(8, 8 / zoom);
  // Touch hit target size: 48px in screen coordinates
  const touchSize = Math.max(48, 48 / zoom);

  const rotStalkLength = Math.max(24, 24 / zoom);
  const rotHandleY = y - rotStalkLength;

  const transform = rotation !== 0 ? `rotate(${rotation} ${cx} ${cy})` : undefined;

  const handles: { handle: DragHandle; hx: number; hy: number; cursor: string }[] = [
    { handle: 'nw', hx: x, hy: y, cursor: 'nwse-resize' },
    { handle: 'n', hx: cx, hy: y, cursor: 'ns-resize' },
    { handle: 'ne', hx: x + width, hy: y, cursor: 'nesw-resize' },
    { handle: 'e', hx: x + width, hy: cy, cursor: 'ew-resize' },
    { handle: 'se', hx: x + width, hy: y + height, cursor: 'nwse-resize' },
    { handle: 's', hx: cx, hy: y + height, cursor: 'ns-resize' },
    { handle: 'sw', hx: x, hy: y + height, cursor: 'nesw-resize' },
    { handle: 'w', hx: x, hy: cy, cursor: 'ew-resize' },
  ];

  return (
    <g transform={transform} className="pointer-events-auto">
      {/* Invisible fill for dragging the selection directly */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="transparent"
        style={{ touchAction: 'none' }}
        className="cursor-move"
        onPointerDown={e => {
          e.currentTarget.setPointerCapture?.(e.pointerId);
          onMovePointerDown(e);
        }}
      />

      {/* Primary selection outline */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="none"
        stroke="#38bdf8"
        strokeWidth={Math.max(1.5, 1.5 / zoom)}
        strokeDasharray={isSingleSelection ? undefined : '4 4'}
        className="pointer-events-none"
      />

      {/* Rotation stalk and handle */}
      {isSingleSelection && (
        <g>
          {/* Stalk line */}
          <line
            x1={cx}
            y1={y}
            x2={cx}
            y2={rotHandleY}
            stroke="#38bdf8"
            strokeWidth={Math.max(1.5, 1.5 / zoom)}
            className="pointer-events-none"
          />
          {/* Large touch area for rotation */}
          <circle
            cx={cx}
            cy={rotHandleY}
            r={touchSize / 2}
            fill="transparent"
            style={{ touchAction: 'none' }}
            className="cursor-grab active:cursor-grabbing"
            onPointerDown={e => {
              e.currentTarget.setPointerCapture?.(e.pointerId);
              onRotatePointerDown(e);
            }}
          />
          {/* Visual rotation circle */}
          <circle
            cx={cx}
            cy={rotHandleY}
            r={visualSize / 1.5}
            fill="#ffffff"
            stroke="#38bdf8"
            strokeWidth={Math.max(2, 2 / zoom)}
            className="pointer-events-none"
          />
        </g>
      )}

      {/* 8 Resize Handles with 48x48px touch targets */}
      {handles.map(({ handle, hx, hy, cursor }) => (
        <g key={handle}>
          {/* Touch target circle */}
          <rect
            x={hx - touchSize / 2}
            y={hy - touchSize / 2}
            width={touchSize}
            height={touchSize}
            fill="transparent"
            style={{ cursor, touchAction: 'none' }}
            onPointerDown={e => {
              e.currentTarget.setPointerCapture?.(e.pointerId);
              onHandlePointerDown(handle, e);
            }}
          />
          {/* Visual handle square */}
          <rect
            x={hx - visualSize / 2}
            y={hy - visualSize / 2}
            width={visualSize}
            height={visualSize}
            fill="#ffffff"
            stroke="#38bdf8"
            strokeWidth={Math.max(1.5, 1.5 / zoom)}
            rx={1}
            className="pointer-events-none shadow-sm"
          />
        </g>
      ))}

      {/* Dimension Label Badge (e.g. "390 × 844") */}
      <g
        transform={`translate(${cx}, ${y + height + Math.max(16, 16 / zoom)})`}
        className="pointer-events-none select-none"
      >
        <rect
          x={-40 / zoom}
          y={-10 / zoom}
          width={80 / zoom}
          height={20 / zoom}
          rx={4 / zoom}
          fill="#1e293b"
          opacity={0.9}
        />
        <text
          x={0}
          y={4 / zoom}
          fill="#38bdf8"
          fontSize={Math.max(10, 11 / zoom)}
          fontFamily="JetBrains Mono, monospace"
          fontWeight="500"
          textAnchor="middle"
        >
          {`${Math.round(width)} × ${Math.round(height)}`}
        </text>
      </g>
    </g>
  );
};

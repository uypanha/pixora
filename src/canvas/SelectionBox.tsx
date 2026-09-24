import { DragHandle } from '../types/editor';
import { RectBounds } from '../utils/math';

interface SelectionBoxProps {
  bounds: RectBounds;
  rotation?: number;
  zoom: number;
  isSingleSelection: boolean;
  title?: string;
  onHandlePointerDown: (handle: DragHandle, e: React.PointerEvent) => void;
  onRotatePointerDown: (e: React.PointerEvent) => void;
  onMovePointerDown: (e: React.PointerEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
}

export const SelectionBox: React.FC<SelectionBoxProps> = ({
  bounds,
  rotation = 0,
  zoom,
  isSingleSelection,
  title,
  onHandlePointerDown,
  onRotatePointerDown,
  onMovePointerDown,
  onContextMenu,
  onDoubleClick,
}) => {
  const { x, y, width, height } = bounds;
  const cx = x + width / 2;
  const cy = y + height / 2;

  // Visual handle size
  const visualSize = Math.max(9, 9 / zoom);
  // Touch hit target size: 48px in screen coordinates
  const touchSize = Math.max(48, 48 / zoom);

  const rotStalkLength = Math.max(24, 24 / zoom);
  const rotHandleY = y - rotStalkLength;

  const transform = rotation !== 0 ? `rotate(${rotation} ${cx} ${cy})` : undefined;

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const handles: { handle: DragHandle; hx: number; hy: number; cursor: string }[] = isMobile
    ? [
        { handle: 'nw', hx: x, hy: y, cursor: 'nwse-resize' },
        { handle: 'ne', hx: x + width, hy: y, cursor: 'nesw-resize' },
        { handle: 'se', hx: x + width, hy: y + height, cursor: 'nwse-resize' },
        { handle: 'sw', hx: x, hy: y + height, cursor: 'nesw-resize' },
      ]
    : [
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
        onContextMenu={e => {
          e.preventDefault();
          e.stopPropagation();
          onContextMenu?.(e);
        }}
        onDoubleClick={e => {
          e.stopPropagation();
          onDoubleClick?.(e);
        }}
        onPointerDown={e => {
          if (e.button !== 0) return;
          e.currentTarget.setPointerCapture?.(e.pointerId);
          onMovePointerDown(e);
        }}
      />

      {/* Top Header Labels: Name on left, Dimensions on right */}
      <g className="pointer-events-none select-none">
        {title && (
          <text
            x={x}
            y={y - 8 / zoom}
            fill="#64748B"
            fontSize={Math.max(10, 11 / zoom)}
            fontWeight="600"
          >
            {title}
          </text>
        )}
        <text
          x={x + width}
          y={y - 8 / zoom}
          textAnchor="end"
          fill="#64748B"
          fontSize={Math.max(10, 11 / zoom)}
          fontWeight="500"
        >
          {`${Math.round(width)} × ${Math.round(height)}`}
        </text>
      </g>

      {/* Primary selection outline */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="none"
        stroke="#6366F1"
        strokeWidth={Math.max(1.5, 1.5 / zoom)}
        strokeDasharray={isSingleSelection ? undefined : '4 4'}
        className="pointer-events-none"
      />

      {/* Rotation stalk and handle (desktop only) */}
      {isSingleSelection && !isMobile && (
        <g>
          {/* Stalk line */}
          <line
            x1={cx}
            y1={y}
            x2={cx}
            y2={rotHandleY}
            stroke="#6366F1"
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
            stroke="#6366F1"
            strokeWidth={Math.max(2, 2 / zoom)}
            className="pointer-events-none shadow-sm"
          />
        </g>
      )}

      {/* Resize Handles with 48x48px touch targets */}
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
          {/* Visual circular handle */}
          <circle
            cx={hx}
            cy={hy}
            r={visualSize / 2}
            fill="#ffffff"
            stroke="#6366F1"
            strokeWidth={Math.max(1.5, 1.5 / zoom)}
            className="pointer-events-none shadow-sm"
          />
        </g>
      ))}
    </g>
  );
};

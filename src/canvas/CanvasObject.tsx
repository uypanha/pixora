import React, { memo } from 'react';
import {
  PixoraObject,
  FrameObject,
  RectangleObject,
  EllipseObject,
  LineObject,
  TextObject,
  ImageObject,
  GroupObject,
  PixoraAsset,
} from '../types/document';

interface CanvasObjectProps {
  object: PixoraObject;
  objects: Record<string, PixoraObject>;
  assets: Record<string, PixoraAsset>;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: (id: string, e: React.MouseEvent | React.TouchEvent) => void;
  onObjectPointerDown?: (id: string, e: React.PointerEvent) => void;
  onDoubleClick?: (id: string, e: React.MouseEvent) => void;
  onContextMenu?: (id: string, e: React.MouseEvent) => void;
  zoom: number;
  editingTextId?: string | null;
}

export const CanvasObject: React.FC<CanvasObjectProps> = memo(
  ({
    object,
    objects,
    assets,
    isSelected,
    isHovered,
    onSelect,
    onObjectPointerDown,
    onDoubleClick,
    onContextMenu,
    zoom,
    editingTextId,
  }) => {
    if (!object.visible) return null;
    // Hide the SVG text while the textarea overlay is active to avoid stacking
    if (object.type === 'text' && object.id === editingTextId) return null;

    const { x, y, width, height, rotation = 0, opacity = 1 } = object;
    const cx = x + width / 2;
    const cy = y + height / 2;
    const transform = rotation !== 0 ? `rotate(${rotation} ${cx} ${cy})` : undefined;

    const handlePointerDown = (e: React.PointerEvent) => {
      e.stopPropagation();
      if (onObjectPointerDown) {
        onObjectPointerDown(object.id, e);
      } else {
        onSelect(object.id, e);
      }
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onDoubleClick?.(object.id, e);
    };

    const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onContextMenu?.(object.id, e);
    };

    // Construct drop shadow filter id if object has shadow
    const filterId = (object as any).shadow ? `shadow-${object.id}` : undefined;

    const renderShadowFilter = () => {
      const shadow = (object as any).shadow;
      if (!shadow) return null;
      return (
        <defs>
          <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow
              dx={shadow.x}
              dy={shadow.y}
              stdDeviation={shadow.blur / 2}
              floodColor={shadow.color}
            />
          </filter>
        </defs>
      );
    };

    switch (object.type) {
      case 'frame': {
        const frame = object as FrameObject;
        const clipId = `clip-${frame.id}`;

        return (
          <g
            id={`node-${frame.id}`}
            transform={transform}
            opacity={opacity}
            onPointerDown={handlePointerDown}
            onContextMenu={handleContextMenu}
            className="cursor-pointer"
          >
            {renderShadowFilter()}

            {/* Frame Label */}
            <text
              x={x}
              y={y - 8 / zoom}
              fill="#9ca3af"
              fontSize={Math.max(11, 12 / zoom)}
              fontFamily="Inter, sans-serif"
              fontWeight="500"
              className="select-none pointer-events-auto hover:fill-pixora-accent transition-colors"
            >
              {frame.name}
            </text>

            <defs>
              <clipPath id={clipId}>
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  rx={frame.cornerRadius || 0}
                  ry={frame.cornerRadius || 0}
                />
              </clipPath>
            </defs>

            {/* Frame Background */}
            <rect
              x={x}
              y={y}
              width={width}
              height={height}
              rx={frame.cornerRadius || 0}
              ry={frame.cornerRadius || 0}
              fill={frame.fill || '#ffffff'}
              stroke={frame.stroke || 'transparent'}
              strokeWidth={frame.strokeWidth || 0}
              filter={filterId ? `url(#${filterId})` : undefined}
            />

            {/* Frame Children */}
            <g clipPath={frame.clipContent ? `url(#${clipId})` : undefined}>
              {frame.childIds.map(childId => {
                const child = objects[childId];
                if (!child) return null;
                return (
                  <CanvasObject
                    key={child.id}
                    object={child}
                    objects={objects}
                    assets={assets}
                    isSelected={isSelected}
                    isHovered={isHovered}
                    onSelect={onSelect}
                    onObjectPointerDown={onObjectPointerDown}
                    onDoubleClick={onDoubleClick}
                    onContextMenu={onContextMenu}
                    zoom={zoom}
                    editingTextId={editingTextId}
                  />
                );
              })}
            </g>
          </g>
        );
      }

      case 'rectangle': {
        const rect = object as RectangleObject;
        return (
          <g
            id={`node-${rect.id}`}
            transform={transform}
            opacity={opacity}
            onPointerDown={handlePointerDown}
            onDoubleClick={handleDoubleClick}
            onContextMenu={handleContextMenu}
            className="cursor-pointer"
          >
            {renderShadowFilter()}
            <rect
              x={x}
              y={y}
              width={width}
              height={height}
              rx={rect.cornerRadius || 0}
              ry={rect.cornerRadius || 0}
              fill={rect.fill || '#6366f1'}
              stroke={rect.stroke || 'transparent'}
              strokeWidth={rect.strokeWidth || 0}
              filter={filterId ? `url(#${filterId})` : undefined}
            />
          </g>
        );
      }

      case 'ellipse': {
        const ellipse = object as EllipseObject;
        return (
          <g
            id={`node-${ellipse.id}`}
            transform={transform}
            opacity={opacity}
            onPointerDown={handlePointerDown}
            onDoubleClick={handleDoubleClick}
            onContextMenu={handleContextMenu}
            className="cursor-pointer"
          >
            {renderShadowFilter()}
            <ellipse
              cx={cx}
              cy={cy}
              rx={width / 2}
              ry={height / 2}
              fill={ellipse.fill || '#38bdf8'}
              stroke={ellipse.stroke || 'transparent'}
              strokeWidth={ellipse.strokeWidth || 0}
              filter={filterId ? `url(#${filterId})` : undefined}
            />
          </g>
        );
      }

      case 'line': {
        const line = object as LineObject;
        return (
          <g
            id={`node-${line.id}`}
            transform={transform}
            opacity={opacity}
            onPointerDown={handlePointerDown}
            onDoubleClick={handleDoubleClick}
            onContextMenu={handleContextMenu}
            className="cursor-pointer"
          >
            {/* Invisible thicker hit box for easy clicking/touching */}
            <line
              x1={x}
              y1={cy}
              x2={x + width}
              y2={cy}
              stroke="transparent"
              strokeWidth={Math.max(24, (line.strokeWidth || 2) * 4)}
            />
            <line
              x1={x}
              y1={cy}
              x2={x + width}
              y2={cy}
              stroke={line.stroke || '#ffffff'}
              strokeWidth={line.strokeWidth || 2}
              strokeLinecap={line.lineCap || 'round'}
              strokeDasharray={line.dashArray}
            />
          </g>
        );
      }

      case 'text': {
        const text = object as TextObject;
        const fontSize = text.fontSize || 16;
        const lineHeightPx = fontSize * (text.lineHeight || 1.4);
        const lines = (text.text || '').split('\n');

        let textAnchor = 'start';
        let startX = x;
        if (text.textAlign === 'center') {
          textAnchor = 'middle';
          startX = x + width / 2;
        } else if (text.textAlign === 'right') {
          textAnchor = 'end';
          startX = x + width;
        }

        return (
          <g
            id={`node-${text.id}`}
            transform={transform}
            opacity={opacity}
            onPointerDown={handlePointerDown}
            onDoubleClick={handleDoubleClick}
            onContextMenu={handleContextMenu}
            className="cursor-text"
          >
            {renderShadowFilter()}
            {/* Transparent background for easier selection */}
            <rect
              x={x}
              y={y}
              width={width}
              height={Math.max(height, lines.length * lineHeightPx)}
              fill="transparent"
            />
            <text
              x={startX}
              y={y + fontSize}
              fill={text.color || '#ffffff'}
              fontFamily={text.fontFamily ? `'${text.fontFamily.replace(/'/g, "\\'")}', sans-serif` : 'Inter, sans-serif'}
              fontSize={fontSize}
              fontWeight={text.fontWeight || 400}
              letterSpacing={text.letterSpacing ? `${text.letterSpacing}px` : undefined}
              textAnchor={textAnchor as 'start' | 'middle' | 'end'}
              filter={filterId ? `url(#${filterId})` : undefined}
              className="select-none pointer-events-none"
            >
              {lines.map((line, idx) => (
                <tspan key={idx} x={startX} dy={idx === 0 ? 0 : lineHeightPx}>
                  {line || ' '}
                </tspan>
              ))}
            </text>
          </g>
        );
      }

      case 'image': {
        const img = object as ImageObject;
        const asset = assets[img.assetId];
        const clipId = `clip-img-${img.id}`;
        const hasRadius = (img.cornerRadius || 0) > 0;

        return (
          <g
            id={`node-${img.id}`}
            transform={transform}
            opacity={opacity}
            onPointerDown={handlePointerDown}
            onDoubleClick={handleDoubleClick}
            onContextMenu={handleContextMenu}
            className="cursor-pointer"
          >
            {renderShadowFilter()}

            {hasRadius && (
              <defs>
                <clipPath id={clipId}>
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    rx={img.cornerRadius}
                    ry={img.cornerRadius}
                  />
                </clipPath>
              </defs>
            )}

            {asset?.dataUrl ? (
              <image
                href={asset.dataUrl}
                x={x}
                y={y}
                width={width}
                height={height}
                preserveAspectRatio={
                  img.fit === 'contain'
                    ? 'xMidYMid meet'
                    : img.fit === 'fill'
                    ? 'none'
                    : 'xMidYMid slice'
                }
                clipPath={hasRadius ? `url(#${clipId})` : undefined}
                filter={filterId ? `url(#${filterId})` : undefined}
              />
            ) : (
              <rect
                x={x}
                y={y}
                width={width}
                height={height}
                rx={img.cornerRadius || 0}
                fill="#2a2d36"
                stroke="#3f4352"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
            )}
          </g>
        );
      }

      case 'group': {
        const group = object as GroupObject;
        return (
          <g
            id={`node-${group.id}`}
            transform={transform}
            opacity={opacity}
            onPointerDown={handlePointerDown}
            onDoubleClick={handleDoubleClick}
            onContextMenu={handleContextMenu}
            className="cursor-pointer"
          >
            {group.childIds.map(childId => {
              const child = objects[childId];
              if (!child) return null;
              return (
                <CanvasObject
                  key={child.id}
                  object={child}
                  objects={objects}
                  assets={assets}
                  isSelected={isSelected}
                  isHovered={isHovered}
                  onSelect={onSelect}
                  onObjectPointerDown={onObjectPointerDown}
                  onDoubleClick={onDoubleClick}
                  onContextMenu={onContextMenu}
                  zoom={zoom}
                  editingTextId={editingTextId}
                />
              );
            })}
          </g>
        );
      }

      default:
        return null;
    }
  }
);

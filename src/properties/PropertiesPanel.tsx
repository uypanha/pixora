import React from 'react';
import { Sliders, Grid, Magnet } from 'lucide-react';
import { useDocument } from '../document/documentContext';
import { useEditor } from '../editor/editorContext';
import { AlignSection } from './sections/AlignSection';
import { TransformSection } from './sections/TransformSection';
import { AppearanceSection } from './sections/AppearanceSection';
import { StrokeSection } from './sections/StrokeSection';
import { TypographySection } from './sections/TypographySection';
import { EffectsSection } from './sections/EffectsSection';
import { ImageSection } from './sections/ImageSection';
import { TextObject, ImageObject } from '../types/document';

export const PropertiesPanel: React.FC = () => {
  const { document, updateSettings } = useDocument();
  const { selectedIds } = useEditor();

  const selectedObjects = selectedIds.map(id => document.objects[id]).filter(Boolean);
  const primaryObject = selectedObjects[0];

  return (
    <aside className="w-64 bg-pixora-surface border-l border-pixora-border flex flex-col h-full select-none z-20 shrink-0 overflow-y-auto">
      {primaryObject ? (
        <>
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-pixora-border">
            <div className="flex items-center space-x-1.5 truncate">
              <span className="text-xs font-semibold text-white truncate">
                {primaryObject.name}
              </span>
            </div>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-pixora-elevated text-pixora-selection border border-pixora-border">
              {primaryObject.type}
            </span>
          </div>

          {/* Alignment */}
          <AlignSection />

          {/* Transform */}
          <TransformSection object={primaryObject} />

          {/* Typography (for text) */}
          {primaryObject.type === 'text' && (
            <TypographySection object={primaryObject as TextObject} />
          )}

          {/* Appearance (fill, opacity, radius) */}
          <AppearanceSection object={primaryObject} />

          {/* Stroke */}
          <StrokeSection object={primaryObject} />

          {/* Image properties */}
          {primaryObject.type === 'image' && (
            <ImageSection object={primaryObject as ImageObject} />
          )}

          {/* Effects */}
          <EffectsSection object={primaryObject} />
        </>
      ) : (
        /* Canvas & Document Properties when nothing is selected */
        <div className="p-3 space-y-4">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-pixora-text-muted uppercase tracking-wider">
            <Sliders size={14} className="text-pixora-text-dim" />
            <span>Document Settings</span>
          </div>

          {/* Grid Settings */}
          <div className="space-y-2 text-xs bg-pixora-elevated p-2.5 rounded-lg border border-pixora-border">
            <div className="flex items-center justify-between font-medium text-white">
              <div className="flex items-center space-x-1.5">
                <Grid size={13} className="text-pixora-selection" />
                <span>Canvas Grid</span>
              </div>
              <input
                type="checkbox"
                checked={document.settings.grid.enabled}
                onChange={e =>
                  updateSettings({
                    grid: {
                      ...document.settings.grid,
                      enabled: e.target.checked,
                    },
                  })
                }
                className="accent-pixora-accent cursor-pointer"
              />
            </div>

            {document.settings.grid.enabled && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="flex items-center justify-between bg-pixora-surface px-2 py-1 rounded border border-pixora-border">
                  <span className="text-pixora-text-dim">Size</span>
                  <input
                    type="number"
                    min={4}
                    max={64}
                    value={document.settings.grid.size}
                    onChange={e =>
                      updateSettings({
                        grid: {
                          ...document.settings.grid,
                          size: Math.max(4, Number(e.target.value)),
                        },
                      })
                    }
                    className="bg-transparent text-pixora-text outline-none font-mono w-10 text-right"
                  />
                </div>

                <label className="flex items-center justify-between bg-pixora-surface px-2 py-1 rounded border border-pixora-border cursor-pointer">
                  <span className="text-pixora-text-dim">Snap</span>
                  <input
                    type="checkbox"
                    checked={document.settings.grid.snap}
                    onChange={e =>
                      updateSettings({
                        grid: {
                          ...document.settings.grid,
                          snap: e.target.checked,
                        },
                      })
                    }
                    className="accent-pixora-accent cursor-pointer"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Smart Guides Snapping */}
          <div className="flex items-center justify-between bg-pixora-elevated p-2.5 rounded-lg border border-pixora-border text-xs">
            <div className="flex items-center space-x-1.5 font-medium text-white">
              <Magnet size={13} className="text-rose-400" />
              <span>Smart Alignment Guides</span>
            </div>
            <input
              type="checkbox"
              checked={document.settings.snapToObjects}
              onChange={e => updateSettings({ snapToObjects: e.target.checked })}
              className="accent-pixora-accent cursor-pointer"
            />
          </div>

          {/* Project Stats */}
          <div className="pt-2 text-[11px] text-pixora-text-dim space-y-1">
            <div className="flex justify-between">
              <span>Total Objects:</span>
              <span className="font-mono text-pixora-text">
                {Object.keys(document.objects).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total Pages:</span>
              <span className="font-mono text-pixora-text">{document.pages.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Assets:</span>
              <span className="font-mono text-pixora-text">
                {Object.keys(document.assets).length}
              </span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

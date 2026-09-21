import { PixoraObject } from '../types/document';

/**
 * Recursively collects the given object IDs and all descendants (for groups and frames)
 */
export function collectMoveIds(
  rootIds: string[],
  objects: Record<string, PixoraObject>
): string[] {
  const result = new Set<string>();

  const recurse = (id: string) => {
    if (result.has(id)) return;
    result.add(id);
    const obj = objects[id];
    if (obj && (obj.type === 'group' || obj.type === 'frame')) {
      for (const childId of (obj as any).childIds || []) {
        recurse(childId);
      }
    }
  };

  for (const id of rootIds) {
    recurse(id);
  }

  return Array.from(result);
}

/**
 * Returns the topmost selectable target (e.g. group parent) unless deep-select is requested.
 */
export function getSelectableTargetId(
  id: string,
  objects: Record<string, PixoraObject>,
  deepSelect = false
): string {
  if (deepSelect) return id;
  let curr = objects[id];
  let targetId = id;
  while (curr && curr.parentId && objects[curr.parentId]) {
    const parent = objects[curr.parentId];
    if (parent.type === 'group') {
      targetId = parent.id;
      curr = parent;
    } else {
      break;
    }
  }
  return targetId;
}

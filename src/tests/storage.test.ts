import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveActiveProject,
  loadActiveProject,
  clearActiveProject,
  getRecentProjects,
  deleteRecentProject,
  clearAllProjects,
} from '../storage/db';
import { createDefaultProject } from '../document/defaultProject';

describe('Storage & IndexedDB Engine', () => {
  beforeEach(async () => {
    await clearAllProjects();
  });

  it('saves and loads active project from IndexedDB', async () => {
    const doc = createDefaultProject(undefined, 'Autosave Project');
    await saveActiveProject(doc);

    const recovered = await loadActiveProject();
    expect(recovered).not.toBeNull();
    expect(recovered?.metadata.name).toBe('Autosave Project');
    expect(recovered?.metadata.id).toBe(doc.metadata.id);
  });

  it('clears active project properly', async () => {
    const doc = createDefaultProject(undefined, 'Temporary Project');
    await saveActiveProject(doc);
    await clearActiveProject();

    const recovered = await loadActiveProject();
    expect(recovered).toBeNull();
  });

  it('maintains recent projects list with delete capabilities', async () => {
    const doc1 = createDefaultProject(undefined, 'Project Alpha');
    const doc2 = createDefaultProject(undefined, 'Project Beta');

    await saveActiveProject(doc1);
    await saveActiveProject(doc2);

    const recents = await getRecentProjects();
    expect(recents.length).toBe(2);
    expect(recents.some(p => p.name === 'Project Alpha')).toBe(true);
    expect(recents.some(p => p.name === 'Project Beta')).toBe(true);

    // Delete one
    await deleteRecentProject(doc1.metadata.id);
    const recentsAfterDelete = await getRecentProjects();
    expect(recentsAfterDelete.length).toBe(1);
    expect(recentsAfterDelete[0].name).toBe('Project Beta');
  });
});

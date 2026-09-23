import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HomeScreen } from '../components/home/HomeScreen';
import { saveActiveProject, clearAllProjects } from '../storage/db';
import { createDefaultProject } from '../document/defaultProject';
import { createDefaultPhotoProject, generateSamplePhotoDataUrl } from '../document/defaultPhotoProject';
import { PROJECT_PRESETS } from '../types/preset';

describe('Figma-like HomeScreen Dashboard', () => {
  beforeEach(async () => {
    await clearAllProjects();
    vi.restoreAllMocks();
  });

  it('renders quick start tiles and empty state when no recents exist', async () => {
    const handleOpenProject = vi.fn();

    render(
      <HomeScreen
        onOpenProject={handleOpenProject}
        hasActiveProject={false}
      />
    );

    // Verify Brand & Quick start templates
    expect(screen.getByText('Pixora')).toBeInTheDocument();
    expect(screen.getByText('Start a New Project')).toBeInTheDocument();
    expect(screen.getAllByText('Blank Canvas').length).toBeGreaterThan(0);
    expect(screen.getByText('Mobile App')).toBeInTheDocument();
    expect(screen.getByText('Desktop Web')).toBeInTheDocument();
    expect(screen.getByText('Edit Photo')).toBeInTheDocument();
    expect(screen.getByText('✨ Load Sample Project')).toBeInTheDocument();
    expect(screen.getByText('Load Sample Photo')).toBeInTheDocument();

    // Verify empty state
    await waitFor(() => {
      expect(screen.getByText('No recent projects yet')).toBeInTheDocument();
    });
  });

  it('displays recent projects in grid view and opens a project on click', async () => {
    const handleOpenProject = vi.fn();

    // Seed a canvas project and a photo project in DB
    const canvasDoc = createDefaultProject(PROJECT_PRESETS[0], 'Mobile App Redesign');
    await saveActiveProject(canvasDoc);

    const photoUrl = generateSamplePhotoDataUrl(400, 300);
    const photoDoc = createDefaultPhotoProject(photoUrl, {
      projectName: 'Sunset Portrait',
      assetName: 'portrait.jpg',
      width: 400,
      height: 300,
    });
    await saveActiveProject(photoDoc);

    render(
      <HomeScreen
        onOpenProject={handleOpenProject}
        hasActiveProject={true}
        activeProjectName="Sunset Portrait"
      />
    );

    // Verify projects appear
    await waitFor(() => {
      expect(screen.getByText('Sunset Portrait')).toBeInTheDocument();
      expect(screen.getByText('Mobile App Redesign')).toBeInTheDocument();
    });

    // Click on canvas project to open
    fireEvent.click(screen.getByText('Mobile App Redesign'));
    expect(handleOpenProject).toHaveBeenCalledTimes(1);
    expect(handleOpenProject.mock.calls[0][0].metadata.name).toBe('Mobile App Redesign');
  });

  it('filters recent projects by type (Canvas vs Photo)', async () => {
    const canvasDoc = createDefaultProject(PROJECT_PRESETS[0], 'Figma Wireframe');
    await saveActiveProject(canvasDoc);

    const photoUrl = generateSamplePhotoDataUrl(400, 300);
    const photoDoc = createDefaultPhotoProject(photoUrl, {
      projectName: 'Nature Landscape',
      assetName: 'nature.jpg',
      width: 400,
      height: 300,
    });
    await saveActiveProject(photoDoc);

    render(
      <HomeScreen
        onOpenProject={vi.fn()}
        hasActiveProject={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Figma Wireframe')).toBeInTheDocument();
      expect(screen.getByText('Nature Landscape')).toBeInTheDocument();
    });

    // Filter to Photos only
    fireEvent.click(screen.getByText(/Photos \(1\)/i));
    expect(screen.getByText('Nature Landscape')).toBeInTheDocument();
    expect(screen.queryByText('Figma Wireframe')).not.toBeInTheDocument();

    // Filter to Canvas only
    fireEvent.click(screen.getByText(/Canvas \(1\)/i));
    expect(screen.getByText('Figma Wireframe')).toBeInTheDocument();
    expect(screen.queryByText('Nature Landscape')).not.toBeInTheDocument();
  });

  it('filters recent projects by search query', async () => {
    const doc1 = createDefaultProject(PROJECT_PRESETS[0], 'Alpha Landing Page');
    await saveActiveProject(doc1);

    const doc2 = createDefaultProject(PROJECT_PRESETS[1], 'Beta Dashboard');
    await saveActiveProject(doc2);

    render(
      <HomeScreen
        onOpenProject={vi.fn()}
        hasActiveProject={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Alpha Landing Page')).toBeInTheDocument();
      expect(screen.getByText('Beta Dashboard')).toBeInTheDocument();
    });

    // Type "Beta" into search box
    const searchInputs = screen.getAllByPlaceholderText(/Search/i);
    fireEvent.change(searchInputs[0], { target: { value: 'Beta' } });

    expect(screen.getByText('Beta Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Alpha Landing Page')).not.toBeInTheDocument();
  });

  it('creates a new blank canvas project on quick start click', () => {
    const handleOpenProject = vi.fn();

    render(
      <HomeScreen
        onOpenProject={handleOpenProject}
        hasActiveProject={false}
      />
    );

    fireEvent.click(screen.getAllByText('Blank Canvas')[0]);
    expect(handleOpenProject).toHaveBeenCalledTimes(1);
    expect(handleOpenProject.mock.calls[0][0].projectType).toBe('canvas');
  });

  it('resumes active project when clicking continue button in header', () => {
    const handleResume = vi.fn();

    render(
      <HomeScreen
        onOpenProject={vi.fn()}
        onResumeActiveProject={handleResume}
        hasActiveProject={true}
        activeProjectName="Current Working File"
      />
    );

    const resumeBtn = screen.getByText(/Continue: Current Working File/i);
    expect(resumeBtn).toBeInTheDocument();
    fireEvent.click(resumeBtn);
    expect(handleResume).toHaveBeenCalledTimes(1);
  });

  it('switches between grid view and list view', async () => {
    const doc = createDefaultProject(PROJECT_PRESETS[0], 'Dashboard Prototype');
    await saveActiveProject(doc);

    render(
      <HomeScreen
        onOpenProject={vi.fn()}
        hasActiveProject={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard Prototype')).toBeInTheDocument();
    });

    // Switch to List view
    const listViewBtn = screen.getByTitle('List view');
    fireEvent.click(listViewBtn);

    // Table header should be rendered
    expect(screen.getByText('Project')).toBeInTheDocument();
    expect(screen.getByText('Last Modified')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();

    // Switch back to Grid view
    const gridViewBtn = screen.getByTitle('Grid view');
    fireEvent.click(gridViewBtn);
    expect(screen.queryByText('Last Modified')).not.toBeInTheDocument();
  });
});

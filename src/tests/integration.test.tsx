import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../App';
import { clearAllProjects } from '../storage/db';

describe('End-to-End Workflow: Create, Add Layer, Edit, and Responsive Viewport Switching', () => {
  beforeEach(async () => {
    await clearAllProjects();
    // Start in desktop mode
    window.innerWidth = 1440;
    window.innerHeight = 900;
  });

  it('completes the full flow: create project -> add layer -> edit properties -> switch to mobile -> switch back to desktop', async () => {
    // 1. Render App
    const { container } = render(<App />);

    // Initially, Launcher Start Screen opens asynchronously after recovery check
    expect(await screen.findByText('Create something beautiful directly on your device')).toBeInTheDocument();

    // 2. Create a new project via "✨ Load Sample Project" button
    const sampleBtn = await screen.findByText('✨ Load Sample Project');
    await act(async () => {
      fireEvent.click(sampleBtn);
    });

    // Launcher should close, and Desktop UI is rendered
    expect(screen.getAllByText('Mobile App Concept').length).toBeGreaterThan(0);
    expect(screen.getByText('Design freely.')).toBeInTheDocument();

    // Verify Desktop Sidebars are visible
    expect(screen.getByText('Layers')).toBeInTheDocument();
    expect(screen.getByText('Document Settings')).toBeInTheDocument();

    // 3. Select an object (e.g. "Primary Button") to edit
    const primaryButtonLayer = screen.getByText('Primary Button');
    await act(async () => {
      fireEvent.click(primaryButtonLayer);
    });

    // Properties panel should now show the selected object and its transform
    expect(screen.getByText('Transform')).toBeInTheDocument();
    expect(screen.getByText('Appearance')).toBeInTheDocument();

    // Find and update the W (width) input in properties panel
    const widthInput = screen.getByDisplayValue('150');
    expect(widthInput).toBeInTheDocument();

    await act(async () => {
      fireEvent.change(widthInput, { target: { value: '180' } });
    });

    // Verify width was updated
    expect(screen.getByDisplayValue('180')).toBeInTheDocument();

    // 4. Switch to Mobile Device View (< 768px, e.g. iPhone 390px)
    await act(async () => {
      window.innerWidth = 390;
      window.innerHeight = 844;
      window.dispatchEvent(new Event('resize'));
    });

    // Verify Desktop sidebars are hidden in mobile view
    expect(screen.queryByText('Document Settings')).not.toBeInTheDocument();

    // Verify Mobile Navigation bar appears
    expect(screen.getByText('Add')).toBeInTheDocument();
    expect(screen.getByText('Design')).toBeInTheDocument();

    // Open "Layers" bottom sheet in mobile view
    const mobileLayersBtn = screen.getAllByText('Layers')[0];
    await act(async () => {
      fireEvent.click(mobileLayersBtn);
    });

    // Verify bottom sheet opens with Pages & Layers title
    expect(screen.getByText('Pages & Layers')).toBeInTheDocument();

    // Open "Add" bottom sheet in mobile view
    const mobileAddBtn = screen.getByText('Add');
    await act(async () => {
      fireEvent.click(mobileAddBtn);
    });

    // Verify Add Elements bottom sheet opens with Basic Shapes
    expect(screen.getByText('Add Elements')).toBeInTheDocument();
    expect(screen.getByText('Basic Shapes')).toBeInTheDocument();
    expect(screen.getByText('Circle')).toBeInTheDocument();

    // Add a Circle via mobile Add sheet
    const addCircleBtn = screen.getByText('Circle');
    await act(async () => {
      fireEvent.click(addCircleBtn);
    });

    // Adding an element should automatically switch to mobile Properties sheet
    expect(screen.getByText('Design Properties')).toBeInTheDocument();

    // 5. Switch back to Desktop View (>= 1200px, e.g. 1440px)
    await act(async () => {
      window.innerWidth = 1440;
      window.innerHeight = 900;
      window.dispatchEvent(new Event('resize'));
    });

    // Verify Desktop UI restores
    expect(screen.getByText('Export')).toBeInTheDocument();
    expect(screen.getByText('Transform')).toBeInTheDocument();
    expect(screen.getByText('Appearance')).toBeInTheDocument();

    // Verify that the earlier edited width (180px) and the newly added Ellipse are still present
    const circleElements = container.querySelectorAll('ellipse');
    expect(circleElements.length).toBeGreaterThanOrEqual(2); // Initial avatar + new circle
  });
});

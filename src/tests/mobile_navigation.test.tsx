import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../App';
import { clearAllProjects } from '../storage/db';

describe('Mobile and Browser Back Navigation', () => {
  beforeEach(async () => {
    await clearAllProjects();
    window.location.hash = '';
    window.innerWidth = 390;
    window.innerHeight = 844;
  });

  it('pushes #editor to history on opening project, and returns to home on popstate (browser/phone back button)', async () => {
    render(<App />);

    // 1. Initial screen is Home Screen
    expect(await screen.findByText('Your projects')).toBeInTheDocument();

    // 2. Open sample project
    const sampleBtn = await screen.findByText('✨ Load Sample Project');
    await act(async () => {
      fireEvent.click(sampleBtn);
    });

    // 3. We are now in Editor and #editor is in the URL hash
    expect(window.location.hash).toBe('#editor');
    expect(screen.queryByText('Your projects')).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('Mobile App Concept')).toBeInTheDocument();

    // 4. Simulate user pressing phone / browser back button (fires popstate with empty hash)
    await act(async () => {
      window.location.hash = '';
      window.dispatchEvent(new PopStateEvent('popstate', { state: { screen: 'home' } }));
    });

    // 5. User should be returned safely to Home screen instead of exiting app
    expect(await screen.findByText('Your projects')).toBeInTheDocument();
  });

  it('returns to home screen when tapping the MobileTopBar back button', async () => {
    render(<App />);

    // Open sample project
    const sampleBtn = await screen.findByText('✨ Load Sample Project');
    await act(async () => {
      fireEvent.click(sampleBtn);
    });

    expect(screen.getByDisplayValue('Mobile App Concept')).toBeInTheDocument();

    // Find back button in MobileTopBar
    const backBtn = screen.getByTitle('Back to Projects');
    expect(backBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(backBtn);
    });

    // Should return to Home Screen
    expect(await screen.findByText('Your projects')).toBeInTheDocument();
  });
});

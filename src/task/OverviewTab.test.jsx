import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import OverviewTab from './OverviewTab';

describe('OverviewTab', () => {
  it('renders the manager overview sections and the active project context', () => {
    render(
      <OverviewTab
        activeProjectName="Vantage"
        activeSprintLabel="Sprint 5"
      />
    );

    expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByText(/placeholder manager dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/project: vantage/i)).toBeInTheDocument();
    expect(screen.getByText(/sprint: sprint 5/i)).toBeInTheDocument();
    expect(screen.getByText('Sprint status')).toBeInTheDocument();
    expect(screen.getByText('Work in progress')).toBeInTheDocument();
    expect(screen.getByText('Team notes')).toBeInTheDocument();
    expect(screen.getByText('Recent activity')).toBeInTheDocument();
  });
});

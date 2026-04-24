import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CalendarMainTab from './CalendarMainTab';

describe('CalendarMainTab', () => {
  it('renders the placeholder calendar information with the selected project and sprint', () => {
    render(
      <CalendarMainTab
        activeProjectName="Vantage"
        activeSprintLabel="Sprint 5"
      />
    );

    expect(screen.getByRole('heading', { name: 'Calendar' })).toBeInTheDocument();
    expect(screen.getByText(/placeholder calendar view/i)).toBeInTheDocument();
    expect(screen.getByText(/project: vantage/i)).toBeInTheDocument();
    expect(screen.getByText(/sprint: sprint 5/i)).toBeInTheDocument();
    expect(screen.getByText('Upcoming')).toBeInTheDocument();
    expect(screen.getByText(/placeholder sprint ceremonies and deadlines/i)).toBeInTheDocument();
  });
});

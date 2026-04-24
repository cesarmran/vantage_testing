import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MainApp from './MainApp';

const mockUseAuth = vi.fn();

vi.mock('./authenticator/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('./authenticator/AuthLanding', () => ({
  default: () => <div>Auth Landing</div>,
}));

vi.mock('./task/CreateTaskModal', () => ({
  default: () => null,
}));

vi.mock('./task/EditTaskModal', () => ({
  default: () => null,
}));

vi.mock('./sprint/CreateSprintModal', () => ({
  default: () => null,
}));

vi.mock('./task/OverviewTab', () => ({
  default: () => <div>Overview Stub</div>,
}));

vi.mock('./task/BacklogMainTab', () => ({
  default: () => <div>Backlog Stub</div>,
}));

vi.mock('./task/DashboardMainTab', () => ({
  default: () => <div>Board Stub</div>,
}));

vi.mock('./task/CalendarMainTab', () => ({
  default: () => <div>Calendar Stub</div>,
}));

vi.mock('./analytics/AnalyticsPage', () => ({
  default: () => <div>Analytics Stub</div>,
}));

describe('MainApp', () => {
  beforeEach(() => {
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => [],
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows a customized dashboard for managers and hides analytics for developers', async () => {
    const user = userEvent.setup();

    mockUseAuth.mockReturnValue({
      user: { name: 'Ana Mora', role: 'MANAGER' },
      logout: vi.fn(),
    });

    const { rerender } = render(<MainApp />);

    const analyticsButton = screen.getByRole('button', { name: 'ANALYTICS' });
    expect(analyticsButton).toBeInTheDocument();

    await user.click(analyticsButton);
    expect(screen.getByText('Analytics Stub')).toBeInTheDocument();

    mockUseAuth.mockReturnValue({
      user: { name: 'Luis Perez', role: 'DEVELOPER' },
      logout: vi.fn(),
    });

    rerender(<MainApp />);
    expect(screen.queryByRole('button', { name: 'ANALYTICS' })).not.toBeInTheDocument();
  });
});

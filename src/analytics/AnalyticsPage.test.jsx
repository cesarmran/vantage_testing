import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AnalyticsPage from './AnalyticsPage';

describe('AnalyticsPage', () => {
  beforeEach(() => {
    global.fetch = vi.fn(async (url) => {
      if (url === '/tasks') {
        return {
          ok: true,
          json: async () => [
            { taskId: 1, taskName: 'Login page', status: 'DONE', sprintId: 8 },
            { taskId: 2, taskName: 'Board filters', status: 'DONE', sprintId: 8 },
            { taskId: 3, taskName: 'Bug fix', status: 'IN_PROGRESS', sprintId: 8 },
          ],
        };
      }

      if (url === '/tasks/assignees/all') {
        return {
          ok: true,
          json: async () => [
            { taskId: 1, oracleId: 101, estimatedCompletionTime: 6 },
            { taskId: 2, oracleId: 202, estimatedCompletionTime: 4 },
            { taskId: 3, oracleId: 101, estimatedCompletionTime: 3 },
          ],
        };
      }

      if (url === '/users') {
        return {
          ok: true,
          json: async () => [
            { oracleId: 101, name: 'Ana Mora', role: 'DEVELOPER' },
            { oracleId: 202, name: 'Luis Perez', role: 'DEVELOPER' },
          ],
        };
      }

      return { ok: true, json: async () => [] };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders team and individual KPI data for the active sprint', async () => {
    render(
      <AnalyticsPage
        sprints={[{ sprintId: 8, sprintName: 'Sprint 8', goal: 'Release reporting improvements' }]}
        activeSprintId="8"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('2 done of 3 tasks')).toBeInTheDocument();
    });

    expect(screen.getByText('67%')).toBeInTheDocument();
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Luis')).toBeInTheDocument();
    expect(screen.getByText('9h')).toBeInTheDocument();
    expect(screen.getByText('4h')).toBeInTheDocument();
    expect(screen.getByText('2 tasks')).toBeInTheDocument();
    expect(screen.getByText('1 tasks')).toBeInTheDocument();
  });
});

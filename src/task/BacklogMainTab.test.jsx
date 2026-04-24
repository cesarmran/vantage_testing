import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BacklogMainTab from './BacklogMainTab';

function buildProps(overrides = {}) {
  return {
    activeProjectName: 'Vantage',
    activeSprintLabel: 'Sprint 5',
    activeSprintId: '5',
    backlogTasks: [
      {
        taskId: 12,
        taskName: 'Close release report',
        description: 'Prepare sprint closure',
        category: 'FEATURE',
        status: 'DONE',
        dueDate: '2026-04-23',
        sprintId: 5,
        storyPoints: 3,
      },
    ],
    setBacklogTasks: vi.fn(),
    backlogLoading: false,
    sprints: [{ sprintId: 5, sprintName: 'Sprint 5' }],
    users: [{ oracleId: 900, name: 'Ana Mora' }],
    taskAssignees: {
      12: {
        taskId: 12,
        oracleId: 900,
        estimatedCompletionTime: 7,
        realTimeSpent: 9,
      },
    },
    isManager: true,
    assignMode: false,
    setAssignMode: vi.fn(),
    selectedTaskIds: new Set(),
    setSelectedTaskIds: vi.fn(),
    assignSprintId: '',
    setAssignSprintId: vi.fn(),
    assigning: false,
    setAssigning: vi.fn(),
    fetchBacklogTasks: vi.fn(),
    setIsCreateTaskOpen: vi.fn(),
    setIsCreateSprintOpen: vi.fn(),
    setEditingTask: vi.fn(),
    ...overrides,
  };
}

describe('BacklogMainTab', () => {
  beforeEach(() => {
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({}),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the minimum ticket information for a completed task in the selected sprint', () => {
    render(<BacklogMainTab {...buildProps()} />);

    expect(screen.getByText('Close release report')).toBeInTheDocument();
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('7 h')).toBeInTheDocument();
    expect(screen.getByText('9 h')).toBeInTheDocument();
    expect(screen.getByText('DONE')).toBeInTheDocument();
  });

  it('lets a developer mark a task as completed from the status selector', async () => {
    const user = userEvent.setup();
    const setBacklogTasks = vi.fn();

    render(
      <BacklogMainTab
        {...buildProps({
          isManager: false,
          setBacklogTasks,
          backlogTasks: [
            {
              taskId: 21,
              taskName: 'Document API',
              description: 'Swagger cleanup',
              category: 'FEATURE',
              status: 'IN_PROGRESS',
              dueDate: '2026-04-25',
              sprintId: 5,
              storyPoints: 2,
            },
          ],
          taskAssignees: {
            21: {
              taskId: 21,
              oracleId: 900,
              estimatedCompletionTime: 4,
              realTimeSpent: 4,
            },
          },
        })}
      />
    );

    const [, statusSelect] = screen.getAllByRole('combobox');
    await user.selectOptions(statusSelect, 'DONE');


    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/tasks/21',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({
            taskName: 'Document API',
            description: 'Swagger cleanup',
            status: 'DONE',
            category: 'FEATURE',
            storyPoints: 2,
            dueDate: '2026-04-25',
            sprintId: 5,
          }),
        })
      );
      expect(setBacklogTasks).toHaveBeenCalled();
    });
  });
});

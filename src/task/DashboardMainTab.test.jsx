import { render, screen, waitFor } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardMainTab from './DashboardMainTab';

describe('DashboardMainTab', () => {
  beforeEach(() => {
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({}),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the tasks assigned to the selected sprint together with the responsible developer', () => {
    render(
      <DashboardMainTab
        activeSprintId="10"
        backlogTasks={[
          {
            taskId: 1,
            taskName: 'Implement login',
            description: 'OAuth flow',
            status: 'TODO',
            category: 'FEATURE',
            storyPoints: 5,
            sprintId: 10,
          },
          {
            taskId: 2,
            taskName: 'Old sprint task',
            description: 'Should not be visible',
            status: 'TODO',
            category: 'BUG',
            storyPoints: 2,
            sprintId: 11,
          },
        ]}
        setBacklogTasks={vi.fn()}
        sprints={[{ sprintId: 10, sprintName: 'Sprint 10' }]}
        users={[{ oracleId: 501, name: 'Ana Mora' }]}
        taskAssignees={{
          1: { taskId: 1, oracleId: 501 },
        }}
      />
    );

    expect(screen.getByText('Implement login')).toBeInTheDocument();
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.queryByText('Old sprint task')).not.toBeInTheDocument();
    expect(screen.getByText('Implement login').closest('.KB-card')).toMatchInlineSnapshot(`
      <div
        class="KB-card  "
        draggable="true"
      >
        <div
          class="KB-card-tags"
        >
          <span
            class="KB-tag KB-tag--feature"
          >
            FEATURE
          </span>
        </div>
        <div
          class="KB-card-title"
        >
          Implement login
        </div>
        <div
          class="KB-card-desc"
        >
          OAuth flow
        </div>
        <div
          class="KB-card-footer"
        >
          <span
            class="KB-card-assignee"
          >
            <span
              class="KB-card-avatar"
            >
              A
            </span>
            Ana
          </span>
          <span
            class="KB-card-points"
          >
            5
             pts
          </span>
        </div>
      </div>
    `);
  });

  it('sends the status change to DONE when a task card is dropped in the completed column', async () => {
    const setBacklogTasks = vi.fn();

    render(
      <DashboardMainTab
        activeSprintId="10"
        backlogTasks={[
          {
            taskId: 1,
            taskName: 'Implement login',
            description: 'OAuth flow',
            status: 'TODO',
            category: 'FEATURE',
            storyPoints: 5,
            sprintId: 10,
            dueDate: '2026-04-30',
          },
        ]}
        setBacklogTasks={setBacklogTasks}
        sprints={[{ sprintId: 10, sprintName: 'Sprint 10' }]}
        users={[{ oracleId: 501, name: 'Ana Mora' }]}
        taskAssignees={{
          1: { taskId: 1, oracleId: 501 },
        }}
      />
    );

    const card = screen.getByText('Implement login').closest('.KB-card');
    const doneColumn = screen.getByText('DONE').closest('.KB-column');
    const dataTransfer = {
      store: {},
      effectAllowed: 'move',
      dropEffect: 'move',
      setData(type, value) {
        this.store[type] = value;
      },
      getData(type) {
        return this.store[type];
      },
    };

    fireEvent.dragStart(card, { dataTransfer });
    fireEvent.dragOver(doneColumn, { dataTransfer });
    fireEvent.drop(doneColumn, { dataTransfer });

    await waitFor(() => {
      expect(setBacklogTasks).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        '/tasks/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({
            taskName: 'Implement login',
            description: 'OAuth flow',
            status: 'DONE',
            category: 'FEATURE',
            storyPoints: 5,
            dueDate: '2026-04-30',
            sprintId: 10,
          }),
        })
      );
    });
  });
});

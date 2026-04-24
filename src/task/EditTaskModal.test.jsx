import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import EditTaskModal from './EditTaskModal';

describe('EditTaskModal', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('updates task data and reassigns the developer with the new estimated hours', async () => {
    const user = userEvent.setup();
    const onTaskUpdated = vi.fn();
    const onClose = vi.fn();

    global.fetch.mockImplementation(async (url, options = {}) => {
      if (url === '/tasks/7/assignees' && !options.method) {
        return {
          ok: true,
          json: async () => [{ taskId: 7, oracleId: 101, estimatedCompletionTime: 6 }],
        };
      }

      if (url === '/tasks/7' && options.method === 'PUT') {
        return {
          ok: true,
          json: async () => ({
            taskId: 7,
            taskName: 'Updated API integration',
            description: 'Updated description',
            status: 'IN_PROGRESS',
            category: 'BUG',
            storyPoints: 8,
            dueDate: '2026-05-01',
            sprintId: 3,
          }),
        };
      }

      return {
        ok: true,
        json: async () => ({}),
        text: async () => '',
      };
    });

    render(
      <EditTaskModal
        open
        task={{
          taskId: 7,
          taskName: 'Original API integration',
          description: 'Original description',
          status: 'TODO',
          category: 'FEATURE',
          storyPoints: 3,
          dueDate: '2026-04-28',
          sprintId: 2,
        }}
        sprints={[
          { sprintId: 2, sprintName: 'Sprint 2' },
          { sprintId: 3, sprintName: 'Sprint 3' },
        ]}
        users={[
          { oracleId: 101, role: 'DEVELOPER', name: 'Ana Mora', mail: 'ana@test.com' },
          { oracleId: 202, role: 'DEVELOPER', name: 'Luis Perez', mail: 'luis@test.com' },
        ]}
        onClose={onClose}
        onTaskUpdated={onTaskUpdated}
      />
    );

    const taskNameInput = screen.getByDisplayValue('Original API integration');
    const descriptionInput = screen.getByDisplayValue('Original description');
    const dueDateInput = screen.getByDisplayValue('2026-04-28');
    const [assigneeSelect, statusSelect, categorySelect, sprintSelect] = screen.getAllByRole('combobox');
    const [storyPointsInput, estimatedTimeInput] = screen.getAllByRole('spinbutton');

    await waitFor(() => {
      expect(assigneeSelect).toHaveValue('101');
      expect(estimatedTimeInput).toHaveValue(6);
    });

    await user.clear(taskNameInput);
    await user.type(taskNameInput, 'Updated API integration');
    await user.clear(descriptionInput);
    await user.type(descriptionInput, 'Updated description');
    await user.selectOptions(statusSelect, 'IN_PROGRESS');
    await user.selectOptions(categorySelect, 'BUG');
    await user.selectOptions(sprintSelect, '3');
    await user.clear(storyPointsInput);
    await user.type(storyPointsInput, '8');
    await user.selectOptions(assigneeSelect, '202');
    await user.clear(estimatedTimeInput);
    await user.type(estimatedTimeInput, '12');
    await user.clear(dueDateInput);
    await user.type(dueDateInput, '2026-05-01');

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/tasks/7',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({
            taskName: 'Updated API integration',
            description: 'Updated description',
            status: 'IN_PROGRESS',
            category: 'BUG',
            storyPoints: 8,
            dueDate: '2026-05-01',
            sprintId: 3,
          }),
        })
      );
    });

    expect(global.fetch).toHaveBeenCalledWith('/tasks/assignees/7/101', { method: 'DELETE' });
    expect(global.fetch).toHaveBeenCalledWith(
      '/tasks/assignees',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          taskId: 7,
          oracleId: 202,
          estimatedCompletionTime: 12,
          realTimeSpent: 0,
        }),
      })
    );

    await waitFor(() => {
      expect(onTaskUpdated).toHaveBeenCalledWith(
        expect.objectContaining({
          taskId: 7,
          taskName: 'Updated API integration',
          storyPoints: 8,
          sprintId: 3,
        })
      );
      expect(onClose).toHaveBeenCalled();
    });
  });
});

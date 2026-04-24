import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CreateTaskModal from './CreateTaskModal';

describe('CreateTaskModal', () => {
  beforeEach(() => {
    global.fetch = vi.fn(async (url, options = {}) => {
      if (url === '/users/developers' && !options.method) {
        return {
          ok: true,
          json: async () => [
            { oracleId: 101, name: 'Ana Mora', mail: 'ana@test.com' },
            { oracleId: 202, name: 'Luis Perez', mail: 'luis@test.com' },
          ],
        };
      }

      if (url === '/sprints' && !options.method) {
        return {
          ok: true,
          json: async () => [
            { sprintId: 5, sprintName: 'Sprint 5' },
            { sprintId: 6, sprintName: 'Sprint 6' },
          ],
        };
      }

      if (url === '/tasks' && options.method === 'POST') {
        return {
          ok: true,
          json: async () => ({ taskId: 77, taskName: 'Create release notes' }),
          text: async () => '',
        };
      }

      if (url === '/tasks/assignees' && options.method === 'POST') {
        return {
          ok: true,
          json: async () => ({ success: true }),
          text: async () => '',
        };
      }

      return {
        ok: true,
        json: async () => [],
        text: async () => '',
      };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the form fields and blocks submission when required fields are missing', async () => {
    const user = userEvent.setup();

    const { container } = render(
      <CreateTaskModal
        open
        onClose={vi.fn()}
        onTaskCreated={vi.fn()}
        sprintId="5"
        createdBy={900}
      />
    );

    expect(screen.getByText('Create Task')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/implement login endpoint/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/describe what needs to be done/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/any notes for the assignee/i)).toBeInTheDocument();
    expect(screen.getAllByRole('combobox')).toHaveLength(4);
    expect(container.querySelector('input[type="date"]')).not.toBeNull();

    await user.click(screen.getByRole('button', { name: /\+ create task/i }));

    expect(screen.getByText('Task name is required.')).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalledWith(
      '/tasks',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('creates the task and assigns the selected developer when the form is completed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onTaskCreated = vi.fn();

    const { container } = render(
      <CreateTaskModal
        open
        onClose={onClose}
        onTaskCreated={onTaskCreated}
        sprintId="5"
        createdBy={900}
      />
    );

    const taskNameInput = screen.getByPlaceholderText(/implement login endpoint/i);
    const descriptionInput = screen.getByPlaceholderText(/describe what needs to be done/i);
    const commentsInput = screen.getByPlaceholderText(/any notes for the assignee/i);
    const [assigneeSelect, statusSelect, categorySelect, sprintSelect] = screen.getAllByRole('combobox');
    const [storyPointsInput, estimatedTimeInput] = screen.getAllByRole('spinbutton');
    const dueDateInput = container.querySelector('input[type="date"]');

    await waitFor(() => {
      expect(screen.getByRole('option', { name: /ana mora/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /sprint 5/i })).toBeInTheDocument();
    });

    await user.type(taskNameInput, 'Create release notes');
    await user.type(descriptionInput, 'Summarize the sprint deliverables');
    await user.selectOptions(assigneeSelect, '101');
    await user.type(commentsInput, 'Prioritize client-facing changes');
    await user.selectOptions(statusSelect, 'IN_PROGRESS');
    await user.selectOptions(categorySelect, 'BUG');
    await user.selectOptions(sprintSelect, '6');
    await user.clear(storyPointsInput);
    await user.type(storyPointsInput, '8');
    await user.type(estimatedTimeInput, '6');
    expect(dueDateInput).not.toBeNull();
    await user.type(dueDateInput, '2026-05-05');

    await user.click(screen.getByRole('button', { name: /\+ create task/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/tasks',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            taskName: 'Create release notes',
            description: 'Summarize the sprint deliverables',
            status: 'IN_PROGRESS',
            category: 'BUG',
            storyPoints: 8,
            dueDate: '2026-05-05',
            sprintId: 6,
            createdBy: 900,
          }),
        })
      );
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/tasks/assignees',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          taskId: 77,
          oracleId: 101,
          estimatedCompletionTime: 6,
          additionalComments: 'Prioritize client-facing changes',
          realTimeSpent: 0,
        }),
      })
    );

    await waitFor(() => {
      expect(onTaskCreated).toHaveBeenCalledWith(
        expect.objectContaining({
          taskId: 77,
          taskName: 'Create release notes',
        })
      );
      expect(onClose).toHaveBeenCalled();
    });
  });
});

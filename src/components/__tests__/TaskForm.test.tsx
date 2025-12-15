import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TaskForm from '../TaskForm';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';


// Mock dependencies
vi.mock('../../api/client', () => ({
    default: {
        get: vi.fn(),
    },
}));

const queryClient = new QueryClient();

const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('TaskForm', () => {
    it('renders all form fields', () => {
        render(
            <Wrapper>
                <TaskForm onSubmit={vi.fn()} />
            </Wrapper>
        );

        expect(screen.getByText('Title')).toBeInTheDocument();
        expect(screen.getByText('Description')).toBeInTheDocument();
        expect(screen.getByText('Due Date')).toBeInTheDocument();
        expect(screen.getByText('Priority')).toBeInTheDocument();
        expect(screen.getByText('Assign To')).toBeInTheDocument();
        expect(screen.getByText('Create Task')).toBeInTheDocument();
    });

    it('validates required fields', async () => {
        const handleSubmit = vi.fn();
        render(
            <Wrapper>
                <TaskForm onSubmit={handleSubmit} />
            </Wrapper>
        );

        fireEvent.click(screen.getByText('Create Task'));

        await waitFor(() => {
            expect(screen.getByText('Title is required')).toBeInTheDocument();
            expect(screen.getByText('Description is required')).toBeInTheDocument();
        });

        expect(handleSubmit).not.toHaveBeenCalled();
    });

    it('submits form with valid data', async () => {
        const handleSubmit = vi.fn();
        render(
            <Wrapper>
                <TaskForm onSubmit={handleSubmit} />
            </Wrapper>
        );

        // Fill out form
        fireEvent.change(screen.getByRole('textbox', { name: /Title/i }), { target: { value: 'My Test Task' } });
        fireEvent.change(screen.getByRole('textbox', { name: /Description/i }), { target: { value: 'This is a description' } });

        // Date input doesn't always support 'textbox' role depending on browser implementation in jsdom, 
        // but often has a label. Let's use getByLabelText or generic selector for safety with jsdom.
        fireEvent.change(screen.getByLabelText(/Due Date/i), { target: { value: '2025-12-31' } });

        fireEvent.click(screen.getByText('Create Task'));

        await waitFor(() => {
            expect(handleSubmit).toHaveBeenCalled();
        });
    });
});

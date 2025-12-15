import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TaskPriority, TaskStatus } from '../types';
import type { User } from '../types';
import api from '../api/client';
import { useQuery } from '@tanstack/react-query';

const taskSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100),
    description: z.string().min(1, 'Description is required'),
    dueDate: z.string(), // Input type="date" returns string
    priority: z.nativeEnum(TaskPriority),
    status: z.nativeEnum(TaskStatus).optional(),
    assignedToId: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormProps {
    initialData?: any;
    onSubmit: (data: TaskFormData) => void;
    isLoading?: boolean;
}

const TaskForm: React.FC<TaskFormProps> = ({ initialData, onSubmit, isLoading }) => {
    const { register, handleSubmit, formState: { errors }, reset } = useForm<TaskFormData>({
        resolver: zodResolver(taskSchema),
        defaultValues: initialData || {
            priority: TaskPriority.Medium,
            status: TaskStatus.ToDo,
        },
    });

    // Fetch users for assignment
    const { data: users } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const res = await api.get<User[]>('/auth/users');
            return res.data;
        }
    });

    useEffect(() => {
        if (initialData) {
            // Format date to YYYY-MM-DD for input
            const date = new Date(initialData.dueDate);
            const formatted = date.toISOString().split('T')[0];
            reset({ ...initialData, dueDate: formatted, assignedToId: initialData.assignedToId?._id || initialData.assignedToId });
        }
    }, [initialData, reset]);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input {...register('title')} aria-label="Title" className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                {errors.title && <p className="text-red-500 text-xs">{errors.title.message}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea {...register('description')} aria-label="Description" rows={3} className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                {errors.description && <p className="text-red-500 text-xs">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Due Date</label>
                    <input type="date" {...register('dueDate')} aria-label="Due Date" className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                    {errors.dueDate && <p className="text-red-500 text-xs">{errors.dueDate.message}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Priority</label>
                    <select {...register('priority')} className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                        {Object.values(TaskPriority).map(p => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {initialData && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <select {...register('status')} className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                            {Object.values(TaskStatus).map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700">Assign To</label>
                    <select {...register('assignedToId')} className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                        <option value="">Unassigned</option>
                        {users?.map(u => (
                            <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    {isLoading ? 'Saving...' : (initialData ? 'Update Task' : 'Create Task')}
                </button>
            </div>
        </form>
    );
};

export default TaskForm;

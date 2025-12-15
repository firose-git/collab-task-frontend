import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import api from '../api/client';
import type { Task } from '../types';
import { TaskPriority, TaskStatus } from '../types';
import TaskItem from '../components/TaskItem';
import Modal from '../components/Modal';
import TaskForm from '../components/TaskForm';
import { Plus, Filter, SortAsc, SortDesc, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const DashboardPage = () => {
    const { user } = useAuth();
    const socket = useSocket();
    const queryClient = useQueryClient();

    const [activeTab, setActiveTab] = useState<'all' | 'assigned' | 'overdue'>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    // Filters state
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [priorityFilter, setPriorityFilter] = useState<string>('');
    const [sortBy, setSortBy] = useState<string>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Fetch Tasks with Filters
    const { data: tasks, isLoading } = useQuery({
        queryKey: ['tasks', statusFilter, priorityFilter, sortBy, sortOrder],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (statusFilter) params.append('status', statusFilter);
            if (priorityFilter) params.append('priority', priorityFilter);
            params.append('sortBy', sortBy);
            params.append('sortOrder', sortOrder);

            const res = await api.get<Task[]>(`/tasks?${params.toString()}`);
            return res.data;
        },
    });

    // Socket Listeners for Real-Time Updates
    useEffect(() => {
        if (!socket) return;

        socket.on('taskCreated', (_newTask: Task) => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            toast.info(`New task created!`);
        });

        socket.on('taskUpdated', (updatedTask: Task) => {
            queryClient.setQueryData(['tasks', statusFilter, priorityFilter, sortBy, sortOrder], (oldData: Task[] | undefined) => {
                if (!oldData) return [updatedTask];
                return oldData.map(t => t._id === updatedTask._id ? updatedTask : t);
            });
            // Also invalidate to be sure
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        });

        socket.on('taskDeleted', (taskId: string) => {
            queryClient.setQueryData(['tasks', statusFilter, priorityFilter, sortBy, sortOrder], (oldData: Task[] | undefined) => {
                if (!oldData) return [];
                return oldData.filter(t => t._id !== taskId);
            });
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        });

        socket.on('notification', (data: any) => {
            toast.success(data.message);
        });

        return () => {
            socket.off('taskCreated');
            socket.off('taskUpdated');
            socket.off('taskDeleted');
            socket.off('notification');
        };
    }, [socket, queryClient, statusFilter, priorityFilter, sortBy, sortOrder]);


    // Mutations
    const createTaskMutation = useMutation({
        mutationFn: (data: any) => api.post('/tasks', data),
        onSuccess: () => {
            setIsModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            toast.success('Task created successfully');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Failed to create task');
        }
    });

    const updateTaskMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/tasks/${id}`, data),
        onSuccess: () => {
            setIsModalOpen(false);
            setEditingTask(null);
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            toast.success('Task updated successfully');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Failed to update task');
        }
    });

    const deleteTaskMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/tasks/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            toast.success('Task deleted');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Failed to delete task');
        }
    });

    const handleCreateOrUpdate = (data: any) => {
        if (editingTask) {
            updateTaskMutation.mutate({ id: editingTask._id, data });
        } else {
            createTaskMutation.mutate(data);
        }
    };

    const openEditModal = (task: Task) => {
        setEditingTask(task);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this task?')) {
            deleteTaskMutation.mutate(id);
        }
    };

    const filteredTasks = tasks?.filter(t => {
        if (activeTab === 'assigned') return t.assignedToId && (typeof t.assignedToId === 'object' ? t.assignedToId._id === user?._id : t.assignedToId === user?._id);
        if (activeTab === 'overdue') return new Date(t.dueDate) < new Date() && t.status !== TaskStatus.Completed;
        return true; // All
    });

    return (
        <div className="space-y-6">

            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                    <p className="text-gray-500">Manage your team tasks effectively.</p>
                </div>
                <button
                    onClick={() => { setEditingTask(null); setIsModalOpen(true); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-transform active:scale-95"
                >
                    <Plus size={20} /> New Task
                </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex gap-6">
                    {(['all', 'assigned', 'overdue'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)} {tab === 'overdue' && <AlertTriangle size={14} className="inline mb-1 ml-1 text-red-500" />}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-wrap gap-4 items-center bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <Filter size={16} /> Filters:
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-sm border-gray-200 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="">All Statuses</option>
                    {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="text-sm border-gray-200 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="">All Priorities</option>
                    {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
                </select>

                <div className="h-4 w-px bg-gray-300 mx-2 hidden sm:block"></div>

                <div className="flex items-center gap-2 text-gray-600 text-sm">
                    {sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />} Sort:
                </div>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="text-sm border-gray-200 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="createdAt">Date Created</option>
                    <option value="dueDate">Due Date</option>
                </select>
                <button
                    onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
                    className="p-1.5 hover:bg-gray-100 rounded text-gray-500"
                    title="Toggle Sort Order"
                >
                    {sortOrder === 'asc' ? 'Asc' : 'Desc'}
                </button>
            </div>

            {/* Task Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-40 bg-gray-200 rounded-xl animate-pulse"></div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTasks?.length === 0 ? (
                        <div className="col-span-full text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                            No tasks found.
                        </div>
                    ) : (
                        filteredTasks?.map(task => (
                            <TaskItem
                                key={task._id}
                                task={task}
                                onEdit={openEditModal}
                                onDelete={handleDelete}
                            />
                        ))
                    )}
                </div>
            )}

            {/* Modals */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingTask ? 'Edit Task' : 'Create New Task'}
            >
                <TaskForm
                    initialData={editingTask}
                    onSubmit={handleCreateOrUpdate}
                    isLoading={createTaskMutation.isPending || updateTaskMutation.isPending}
                />
            </Modal>
        </div>
    );
};

export default DashboardPage;

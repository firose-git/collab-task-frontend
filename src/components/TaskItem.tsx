
import { TaskPriority, TaskStatus } from '../types';
import type { Task } from '../types';
import { Calendar, User as UserIcon } from 'lucide-react';
import { clsx } from 'clsx';

const priorityColors = {
    [TaskPriority.Low]: 'bg-green-100 text-green-800',
    [TaskPriority.Medium]: 'bg-blue-100 text-blue-800',
    [TaskPriority.High]: 'bg-orange-100 text-orange-800',
    [TaskPriority.Urgent]: 'bg-red-100 text-red-800',
};

const statusColors = {
    [TaskStatus.ToDo]: 'border-gray-200',
    [TaskStatus.InProgress]: 'border-blue-300 bg-blue-50',
    [TaskStatus.Review]: 'border-purple-300 bg-purple-50',
    [TaskStatus.Completed]: 'border-green-300 bg-green-50 opacity-70',
};

interface TaskItemProps {
    task: Task;
    onEdit: (task: Task) => void;
    onDelete: (id: string) => void;
    currentUserId?: string;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onEdit, onDelete }) => {
    // Simple date formatter if date-fns not available or just use native
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    const isOverdue = new Date(task.dueDate) < new Date() && task.status !== TaskStatus.Completed;

    return (
        <div className={clsx(
            "p-4 rounded-xl border shadow-sm hover:shadow-md transition-all bg-white flex flex-col gap-3 group px-5",
            statusColors[task.status],
            isOverdue && "border-red-300 bg-red-50"
        )}>
            <div className="flex justify-between items-start">
                <h4 className={clsx("font-semibold text-lg text-gray-900", task.status === TaskStatus.Completed && "line-through text-gray-500")}>
                    {task.title}
                </h4>
                <span className={clsx("text-xs px-2 py-1 rounded-full font-medium", priorityColors[task.priority])}>
                    {task.priority}
                </span>
            </div>

            <p className="text-gray-600 text-sm line-clamp-2">{task.description}</p>

            <div className="flex items-center justify-between text-xs text-gray-500 mt-auto pt-2 border-t border-gray-100/50">
                <div className="flex items-center gap-4">
                    <span className={clsx("flex items-center gap-1", isOverdue ? "text-red-600 font-bold" : "")}>
                        <Calendar size={14} />
                        {formatDate(task.dueDate)}
                    </span>
                    {task.assignedToId && (
                        <span className="flex items-center gap-1" title={`Assigned to ${typeof task.assignedToId === 'object' ? task.assignedToId.name : 'User'}`}>
                            <UserIcon size={14} />
                            {typeof task.assignedToId === 'object' ? task.assignedToId.name.split(' ')[0] : 'Assigned'}
                        </span>
                    )}
                </div>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onEdit(task)}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md"
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => onDelete(task._id)}
                        className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-md"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TaskItem;

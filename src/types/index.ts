export enum TaskPriority {
    Low = 'Low',
    Medium = 'Medium',
    High = 'High',
    Urgent = 'Urgent',
}

export enum TaskStatus {
    ToDo = 'To Do',
    InProgress = 'In Progress',
    Review = 'Review',
    Completed = 'Completed',
}

export interface User {
    _id: string;
    name: string;
    email: string;
}

export interface Task {
    _id: string;
    title: string;
    description: string;
    dueDate: string; // Date string from API
    priority: TaskPriority;
    status: TaskStatus;
    creatorId: User | string; // Populated or ID
    assignedToId?: User | string; // Populated or ID
    createdAt: string;
    updatedAt: string;
}

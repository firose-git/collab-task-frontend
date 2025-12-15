import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import type { User } from '../types';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (data: any) => Promise<void>;
    register: (data: any) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const queryClient = useQueryClient();
    const [user, setUser] = useState<User | null>(null);

    const { data, isLoading: isUserLoading, isError } = useQuery({
        queryKey: ['authUser'],
        queryFn: async () => {
            try {
                const res = await api.get('/auth/profile');
                return res.data;
            } catch (err) {
                return null;
            }
        },
        retry: false,
        staleTime: Infinity,
    });

    useEffect(() => {
        if (data) {
            setUser(data);
        } else if (isError || data === null) {
            setUser(null);
        }
    }, [data, isError]);

    const loginMutation = useMutation({
        mutationFn: async (credentials: any) => {
            const res = await api.post('/auth/login', credentials);
            return res.data;
        },
        onSuccess: (data) => {
            setUser(data);
            queryClient.setQueryData(['authUser'], data);
        },
    });

    const registerMutation = useMutation({
        mutationFn: async (credentials: any) => {
            const res = await api.post('/auth/register', credentials);
            return res.data;
        },
        onSuccess: (data) => {
            setUser(data);
            queryClient.setQueryData(['authUser'], data);
        },
    });

    const logoutMutation = useMutation({
        mutationFn: async () => {
            await api.post('/auth/logout');
        },
        onSuccess: () => {
            setUser(null);
            queryClient.setQueryData(['authUser'], null);
            queryClient.clear();
        },
    });

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading: isUserLoading,
                login: async (data) => await loginMutation.mutateAsync(data),
                register: async (data) => await registerMutation.mutateAsync(data),
                logout: async () => await logoutMutation.mutateAsync(),
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

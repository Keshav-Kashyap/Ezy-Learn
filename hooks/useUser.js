'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Hook to fetch user profile & status flag with React Query caching via /api/users/register
 */
export function useUserProfile(options = {}) {
    return useQuery({
        queryKey: ['userProfile'],
        queryFn: async () => {
            const res = await fetch('/api/users/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!res.ok) throw new Error('Failed to fetch user profile');
            return res.json();
        },
        staleTime: 5 * 60 * 1000, // 5 minutes cache
        gcTime: 10 * 60 * 1000,
        ...options,
    });
}

/**
 * Hook to create/update user profile via /api/users/register
 */
export function useUpdateUserProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ name, course, semester }) => {
            const res = await fetch('/api/users/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, course, semester }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Failed to save profile');
            }
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userProfile'] });
        },
    });
}

/**
 * Hook to invalidate (refresh) user profile cache manually
 */
export function useInvalidateUserProfile() {
    const queryClient = useQueryClient();

    return () => {
        queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    };
}

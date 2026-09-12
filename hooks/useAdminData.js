'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ==================== QUERY KEYS ====================
export const adminKeys = {
  courses: ['admin', 'courses'],
  users: ['admin', 'users'],
  analytics: ['admin', 'analytics'],
  popularNotes: ['admin', 'popularNotes'],
  semesters: (category) => ['admin', 'semesters', category],
  subjects: (category, semester) => ['admin', 'subjects', category, semester],
  materials: (subjectId) => ['admin', 'materials', subjectId],
};

// ==================== API FUNCTIONS ====================
const fetchAdminCourses = async () => {
  const response = await fetch('/api/admin/courses');
  if (!response.ok) {
    throw new Error('Failed to fetch admin courses');
  }
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch courses');
  }
  return data.courses;
};

const fetchAdminUsers = async () => {
  const response = await fetch('/api/admin/users');
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch users');
  }
  return data.users;
};

const fetchAdminAnalytics = async () => {
  const response = await fetch('/api/admin/analytics');
  if (!response.ok) {
    throw new Error('Failed to fetch analytics');
  }
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch analytics');
  }
  return data;
};

const fetchPopularNotes = async () => {
  const response = await fetch('/api/material/popular');
  if (!response.ok) {
    throw new Error('Failed to fetch popular notes');
  }
  const data = await response.json();
  return data;
};

const fetchSemesters = async (category) => {
  const response = await fetch(`/api/courses/${category}/semesters`);
  if (!response.ok) {
    throw new Error('Failed to fetch semesters');
  }
  const data = await response.json();
  return data;
};

const fetchSubjects = async (category, semester) => {
  const response = await fetch(`/api/courses/${category}/semester/${semester}/subjects`);
  if (!response.ok) {
    throw new Error('Failed to fetch subjects');
  }
  const data = await response.json();
  return data;
};

// ==================== CUSTOM HOOKS ====================

/**
 * Hook to fetch admin courses with caching
 */
export function useAdminCourses() {
  return useQuery({
    queryKey: adminKeys.courses,
    queryFn: fetchAdminCourses,
    staleTime: 5 * 60 * 1000, // 5 minutes - no refetch for 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
  });
}

/**
 * Hook to fetch admin users with caching
 */
export function useAdminUsers() {
  return useQuery({
    queryKey: adminKeys.users,
    queryFn: fetchAdminUsers,
    staleTime: 5 * 60 * 1000, // 5 minutes - no refetch for 5 minutes
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to fetch admin analytics with caching
 */
export function useAdminAnalytics() {
  return useQuery({
    queryKey: adminKeys.analytics,
    queryFn: fetchAdminAnalytics,
    staleTime: 5 * 60 * 1000, // 5 minutes - no refetch for 5 minutes
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to fetch popular notes with caching
 */
export function usePopularNotes() {
  return useQuery({
    queryKey: adminKeys.popularNotes,
    queryFn: fetchPopularNotes,
    staleTime: 5 * 60 * 1000, // 5 minutes - no refetch for 5 minutes
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to fetch semesters for a course category
 */
export function useSemesters(category) {
  return useQuery({
    queryKey: adminKeys.semesters(category),
    queryFn: () => fetchSemesters(category),
    enabled: !!category, // Only run if category is provided
    staleTime: 5 * 60 * 1000, // 5 minutes - no refetch for 5 minutes
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to fetch subjects for a semester
 */
export function useSubjects(category, semester) {
  return useQuery({
    queryKey: adminKeys.subjects(category, semester),
    queryFn: () => fetchSubjects(category, semester),
    enabled: !!category && !!semester, // Only run if both params are provided
    staleTime: 5 * 60 * 1000, // 5 minutes - no refetch for 5 minutes
    gcTime: 10 * 60 * 1000,
  });
}/**
 * Hook to invalidate admin data cache
 * Use this after creating/updating/deleting admin data
 */
export function useInvalidateAdminData() {
  const queryClient = useQueryClient();

  return {
    invalidateCourses: () => queryClient.invalidateQueries({ queryKey: adminKeys.courses }),
    invalidateUsers: () => queryClient.invalidateQueries({ queryKey: adminKeys.users }),
    invalidateAnalytics: () => queryClient.invalidateQueries({ queryKey: adminKeys.analytics }),
    invalidatePopularNotes: () => queryClient.invalidateQueries({ queryKey: adminKeys.popularNotes }),
    invalidateSemesters: (category) => queryClient.invalidateQueries({ queryKey: adminKeys.semesters(category) }),
    invalidateSubjects: (category, semester) => queryClient.invalidateQueries({ queryKey: adminKeys.subjects(category, semester) }),
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
  };
}

'use client';

import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ==================== QUERY KEYS ====================
export const courseKeys = {
    all: ['courses'],
    list: () => [...courseKeys.all, 'list'],
    detail: (code) => [...courseKeys.all, 'detail', code],
    byCategory: (category) => [...courseKeys.all, 'category', category],
    stats: () => [...courseKeys.all, 'stats'],
    popularNotes: ['popularNotes'],
    popularCourses: ['popularCourses'],
    reviews: ['reviews'],
    semester: (code, semesterId) => [...courseKeys.all, 'semester', code, semesterId],
};

// ==================== API FUNCTIONS ====================
const fetchCoursesWithPagination = async (page = 1, limit = 10) => {
    const response = await fetch(`/api/courses/minimal?page=${page}&limit=${limit}`);
    if (!response.ok) {
        throw new Error('Failed to fetch courses');
    }
    const data = await response.json();

    if (!data.success) {
        throw new Error(data.error || 'Failed to fetch courses');
    }

    // Transform courses data
    const transformedCourses = data.courses.map(course => ({
        id: course.id,
        title: course.title,
        subtitle: course.category,
        description: course.description || "Comprehensive learning materials and resources.",
        category: course.category,
        code: course.code,
        documents: course.documentsCount || course.totalMaterials || 0,
        students: course.studentsCount || 0,
        semesters: course.semesters || 0,
        duration: course.duration,
        image: course.image || getDefaultImage(course.category),
        bgColor: course.bgColor || 'bg-blue-500'
    }));

    return {
        courses: transformedCourses,
        pagination: data.pagination,
    };
};

const fetchCourses = async (page = 1, limit = 6) => {
    const data = await fetchCoursesWithPagination(page, limit);
    return data.courses;
};

const fetchDashboardStats = async () => {
    const response = await fetch('/api/dashboard/stats');
    if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
    }
    const data = await response.json();

    if (!data.success) {
        throw new Error(data.error || 'Failed to fetch stats');
    }

    return data;
};

const fetchPopularNotes = async (limit = 100, fetchAll = true) => {
    const endpoint = '/api/material/popular?limit=' + limit;
    const response = await fetch(endpoint);
    if (!response.ok) {
        throw new Error('Failed to fetch notes');
    }
    const data = await response.json();

    if (!data.success) {
        throw new Error(data.error || 'Failed to fetch notes');
    }

    return data;
};

const fetchAllNotesPaginated = async (page = 1, limit = 10) => {
    const response = await fetch(`/api/material/all?page=${page}&limit=${limit}`);
    if (!response.ok) {
        throw new Error('Failed to fetch notes page');
    }
    const data = await response.json();

    if (!data.success) {
        throw new Error(data.error || 'Failed to fetch notes page');
    }

    return data;
};

const fetchPopularCourses = async (limit = 6) => {
    const response = await fetch(`/api/popular-courses?limit=${limit}`);
    if (!response.ok) {
        throw new Error('Failed to fetch popular courses');
    }
    const data = await response.json();

    if (!data.success) {
        throw new Error(data.error || 'Failed to fetch popular courses');
    }

    return data.courses;
};

const fetchReviews = async () => {
    const response = await fetch('/api/reviews');
    if (!response.ok) {
        throw new Error('Failed to fetch reviews');
    }
    const data = await response.json();

    if (!data.success) {
        throw new Error(data.error || 'Failed to fetch reviews');
    }

    return data.reviews;
};

const fetchFeaturedReviews = async () => {
    const response = await fetch('/api/reviews/featured');
    if (!response.ok) {
        throw new Error('Failed to fetch reviews');
    }
    const data = await response.json();

    if (!data.success) {
        throw new Error(data.error || 'Failed to fetch reviews');
    }

    return data.reviews;
};

const fetchCourseDetail = async (code) => {
    const response = await fetch(`/api/courses/${code}`);
    if (!response.ok) {
        throw new Error('Failed to fetch course details');
    }
    const data = await response.json();

    if (!data.success) {
        throw new Error(data.error || 'Failed to fetch course details');
    }

    return data.course;
};

const fetchSemesters = async (category) => {
    if (!category) {
        return { semesters: [] };
    }

    const response = await fetch(`/api/courses/${category}`);
    if (!response.ok) {
        throw new Error('Failed to fetch semesters');
    }
    const data = await response.json();

    if (!data.success) {
        throw new Error(data.error || 'Failed to fetch semesters');
    }

    return { semesters: data.course.semesters || [] };
};

const fetchSemesterDetail = async (code, semesterId) => {
    const response = await fetch(`/api/courses/${code}/semester/${semesterId}`);
    if (!response.ok) {
        throw new Error('Failed to fetch semester details');
    }
    const data = await response.json();

    if (!data.success) {
        throw new Error(data.error || 'Failed to fetch semester details');
    }

    return data.semester;
};

const getDefaultImage = (category) => {
    const images = {
        'MCA': "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400&h=300&fit=crop",
        'BCA': "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=300&fit=crop",
        'BTech': "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop"
    };
    return images[category] || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop";
};

// ==================== CUSTOM HOOKS ====================

/**
 * Hook to fetch all courses with caching
 * Data will be cached for 5 minutes, preventing unnecessary API calls
 */
export function useCourses() {
    return useQuery({
        queryKey: courseKeys.list(),
        queryFn: fetchCourses,
        staleTime: 5 * 60 * 1000, // 5 minutes - no refetch for 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
    });
}

/**
 * Hook to fetch courses with infinite pagination
 * Starts with a configurable limit and fetches more pages on demand
 */
export function useInfiniteCourses(limit = 10) {
    return useInfiniteQuery({
        queryKey: [...courseKeys.list(), 'infinite', limit],
        initialPageParam: 1,
        queryFn: ({ pageParam }) => fetchCoursesWithPagination(pageParam, limit),
        getNextPageParam: (lastPage, allPages) => {
            // Stop immediately if backend returns no records for current page.
            if (!lastPage?.courses?.length) {
                return undefined;
            }

            if (lastPage?.pagination?.hasNextPage === true) {
                return lastPage.pagination.currentPage + 1;
            }

            if (lastPage?.pagination?.hasNextPage === false) {
                return undefined;
            }

            // Fallback behavior when pagination metadata is missing.
            if (lastPage.courses.length < limit) {
                return undefined;
            }

            return allPages.length + 1;
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
}

/**
 * Hook to fetch dashboard statistics with caching
 */
export function useDashboardStats() {
    return useQuery({
        queryKey: courseKeys.stats(),
        queryFn: fetchDashboardStats,
        staleTime: 5 * 60 * 1000, // 5 minutes - no refetch for 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
    });
}

/**
 * Hook to fetch popular notes with caching
 * Data cached for 5 minutes to prevent unnecessary API calls
 */
export function usePopularNotes(limit = 100, fetchAll = true) {
    return useQuery({
        queryKey: [...courseKeys.popularNotes, limit, fetchAll],
        queryFn: () => fetchPopularNotes(limit, fetchAll),
        staleTime: 5 * 60 * 1000, // 5 minutes - no refetch for 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
    });
}

/**
 * Hook to fetch paginated all notes with infinite scrolling (10 notes per page)
 */
export function useInfiniteAllNotes(limit = 10) {
    return useInfiniteQuery({
        queryKey: ['allNotes', 'infinite', limit],
        initialPageParam: 1,
        queryFn: ({ pageParam }) => fetchAllNotesPaginated(pageParam, limit),
        getNextPageParam: (lastPage) => {
            if (!lastPage?.notes?.length) {
                return undefined;
            }
            if (lastPage?.pagination?.hasNextPage) {
                return lastPage.pagination.currentPage + 1;
            }
            return undefined;
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
}

/**
 * Hook to fetch popular courses with caching
 * Data cached for 5 minutes to prevent unnecessary API calls
 */
export function usePopularCourses(limit = 6) {
    return useQuery({
        queryKey: [...courseKeys.popularCourses, limit],
        queryFn: () => fetchPopularCourses(limit),
        staleTime: 5 * 60 * 1000, // 5 minutes - no refetch for 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
    });
}

/**
 * Hook to fetch reviews with caching
 * Data cached for 5 minutes to prevent unnecessary API calls
 */
export function useReviews() {
    return useQuery({
        queryKey: courseKeys.reviews,
        queryFn: fetchReviews,
        staleTime: 5 * 60 * 1000, // 5 minutes - no refetch for 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
    });
}


export function useFeaturedReviews() {
    return useQuery({
        queryKey: courseKeys.reviews,
        queryFn: fetchFeaturedReviews,
        staleTime: 5 * 60 * 1000, // 5 minutes - no refetch for 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
    });
}

/**
 * Hook to fetch course detail by code with caching
 * Data cached for 5 minutes
 */
export function useCourseDetail(code) {
    return useQuery({
        queryKey: courseKeys.detail(code),
        queryFn: () => fetchCourseDetail(code),
        enabled: !!code, // Only run if code is provided
        staleTime: 5 * 60 * 1000, // 5 minutes - no refetch for 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
    });
}

/**
 * Hook to fetch semesters for a specific course category
 * Data cached for 5 minutes
 */
export function useSemesters(category) {
    return useQuery({
        queryKey: courseKeys.byCategory(category),
        queryFn: () => fetchSemesters(category),
        enabled: !!category, // Only run if category is provided
        staleTime: 5 * 60 * 1000, // 5 minutes - no refetch for 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
    });
}

/**
 * Hook to fetch semester detail with caching
 * Data cached for 5 minutes
 */
export function useSemesterDetail(code, semesterId, optionsEnabled = true) {
    return useQuery({
        queryKey: courseKeys.semester(code, semesterId),
        queryFn: () => fetchSemesterDetail(code, semesterId),
        enabled: !!code && !!semesterId && Boolean(optionsEnabled), // Only run if code, semesterId, and optionsEnabled are true
        staleTime: 5 * 60 * 1000, // 5 minutes - no refetch for 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
    });
}

export { useUserProfile, useUpdateUserProfile, useInvalidateUserProfile } from './useUser';

/**
 * Hook to fetch available courses with React Query caching
 */
export function useAvailableCourses() {
    return useQuery({
        queryKey: ['availableCourses'],
        queryFn: async () => {
            const res = await fetch('/api/available-courses');
            if (!res.ok) throw new Error('Failed to fetch available courses');
            return res.json();
        },
        staleTime: 5 * 60 * 1000, // 5 minutes cache
        gcTime: 10 * 60 * 1000,
    });
}

/**
 * Fetch semester count for a given course (category / name / code)
 */
const fetchSemestersForCourse = async (course) => {
    if (!course || course === 'Other' || course === 'Others') {
        return 0;
    }
    const response = await fetch(`/api/semesters?course=${encodeURIComponent(course)}`);
    if (!response.ok) {
        throw new Error('Failed to fetch semesters count');
    }
    const data = await response.json();

    if (!data.success) {
        throw new Error(data.error || 'Failed to fetch semesters count');
    }

    return data.count ?? 0;
};

/**
 * Hook to fetch semesters for a specific course with React Query caching
 */
export function useCourseSemesters(course) {
    return useQuery({
        queryKey: ['courseSemesters', course],
        queryFn: () => fetchSemestersForCourse(course),
        enabled: !!course && course !== 'Other' && course !== 'Others',
        staleTime: 5 * 60 * 1000, // 5 minutes cache
        gcTime: 10 * 60 * 1000,
    });
}


/**
 * Hook to get both courses and stats together
 * Useful for dashboard pages
 */
export function useDashboardData() {
    const coursesQuery = useCourses();
    const statsQuery = useDashboardStats();
    const popularNotesQuery = usePopularNotes();

    return {
        courses: coursesQuery.data || [],
        stats: statsQuery.data || {},
        popularNotes: popularNotesQuery.data || [],
        isLoading: coursesQuery.isLoading || statsQuery.isLoading || popularNotesQuery.isLoading,
        isError: coursesQuery.isError || statsQuery.isError || popularNotesQuery.isError,
        error: coursesQuery.error || statsQuery.error || popularNotesQuery.error,
        refetch: () => {
            coursesQuery.refetch();
            statsQuery.refetch();
            popularNotesQuery.refetch();
        }
    };
}

/**
 * Hook to invalidate (refresh) course cache
 * Use this after creating/updating/deleting courses
 */
export function useInvalidateCourses() {
    const queryClient = useQueryClient();

    return () => {
        queryClient.invalidateQueries({ queryKey: courseKeys.all });
    };
}

/**
 * Hook to invalidate (refresh) popular notes cache
 * Use this after liking/updating popular notes
 */
export function useInvalidatePopularNotes() {
    const queryClient = useQueryClient();

    return () => {
        queryClient.invalidateQueries({ queryKey: courseKeys.popularNotes });
    };
}

/**
 * Hook to invalidate (refresh) course detail cache
 * Use this after updating course details
 */
export function useInvalidateCourseDetail(code) {
    const queryClient = useQueryClient();

    return () => {
        queryClient.invalidateQueries({ queryKey: courseKeys.detail(code) });
    };
}

/**
 * Hook to invalidate (refresh) semester detail cache
 * Use this after updating semester details
 */
export function useInvalidateSemesterDetail(code, semesterId) {
    const queryClient = useQueryClient();

    return () => {
        queryClient.invalidateQueries({ queryKey: courseKeys.semester(code, semesterId) });
    };
}

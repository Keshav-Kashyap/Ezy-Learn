"use client"
import React, { useEffect, useMemo, useRef, useState } from 'react'
import CoursesCard from './_components/CoursesCard';
import SearchFilterToolbar from '@/app/(main)/_components/SearchFilterToolbar';
import { useInfiniteCourses } from '@/hooks/useCourses';
import GenericCardSkeleton from '@/app/(main)/_components/skeletons/GenericCardSkeleton';

const page = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const loadMoreRef = useRef(null);

    const {
        data,
        isLoading,
        isError,
        error,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage,
    } = useInfiniteCourses(10);

    const allCourses = useMemo(
        () => data?.pages?.flatMap((pageData) => pageData.courses || []) || [],
        [data]
    );

    useEffect(() => {
        const node = loadMoreRef.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const firstEntry = entries[0];
                if (firstEntry.isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.2 }
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    useEffect(() => {
        const handleScroll = () => {
            if (!hasNextPage || isFetchingNextPage) return;

            const scrollPosition = window.innerHeight + window.scrollY;
            const triggerPoint = document.documentElement.scrollHeight - 300;

            if (scrollPosition >= triggerPoint) {
                fetchNextPage();
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    return (
         <div className=' max-w-7xl mx-auto space-y-12'>
            <SearchFilterToolbar
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onFilterClick={() => console.log('Filter clicked')}
            />
            {!isLoading &&
            <CoursesCard
                courses={allCourses}
                searchQuery={searchQuery}
                viewMode={viewMode}
            />
            }
            <div ref={loadMoreRef} className="h-10 w-full" />

            {isLoading && allCourses.length === 0 && (
                <div className="grid mb-8 gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <GenericCardSkeleton key={`initial-skeleton-${i}`} />
                    ))}
                </div>
            )}

            {isFetchingNextPage && (
                <div className="grid mb-8 gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <GenericCardSkeleton key={`next-page-skeleton-${i}`} />
                    ))}
                </div>
            )}

            {isError && (
                <p className="pb-8 text-center text-sm text-red-500">{error?.message || 'Failed to load courses'}</p>
            )}

            {!isLoading && !isFetchingNextPage && !hasNextPage && allCourses.length > 0 && (
                <p className="pb-8 text-center text-sm text-slate-500">All courses loaded</p>
            )}
        </div>
    )
}

export default page;
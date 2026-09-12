"use client";

import React from 'react';
import CoursesCard from '@/app/(main)/_components/CoursesCard';
import { GraduationCap } from 'lucide-react';
import { useCourses } from '@/hooks/useCourses';

const PopularCoursesGrid = ({ searchQuery = '', viewMode = 'grid' }) => {
    const { data: courses, isLoading } = useCourses();

    return (
        <div className="space-y-6 pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
                <div className="space-y-1">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <GraduationCap className="w-6 h-6 text-indigo-500" />
                        Popular Courses
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Explore top rated academic courses and degree programs
                    </p>
                </div>
            </div>

            <CoursesCard
                courses={courses}
                searchQuery={searchQuery}
                viewMode={viewMode}
                showPopularBadge={true}
            />
        </div>
    );
};

export default PopularCoursesGrid;

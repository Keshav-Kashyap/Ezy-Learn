"use client"

import React, { useState } from 'react'
import PopularNotesGrid from './_components/PupularNotesGrid'
import PopularCoursesGrid from './_components/PopularCoursesGrid'
import SearchFilterToolbar from '@/app/(main)/_components/SearchFilterToolbar'
import { useCourses, usePopularNotes } from '@/hooks/useCourses'
import { FileText } from 'lucide-react'

const Page = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState('all'); // 'all' | 'notes' | 'courses'
    const [viewMode, setViewMode] = useState('grid');

    const { data: notesData, isLoading: isLoadingNotes } = usePopularNotes(50, false);
    const { data: coursesData, isLoading: isLoadingCourses } = useCourses();

    const popularNotes = notesData?.notes || [];
    const allCourses = coursesData || [];

    const query = searchQuery.trim().toLowerCase();

    const matchingNotes = popularNotes.filter(note =>
        !query ||
        (note.title || '').toLowerCase().includes(query) ||
        (note.description || '').toLowerCase().includes(query) ||
        (note.type || '').toLowerCase().includes(query) ||
        (note.category || '').toLowerCase().includes(query)
    );

    const matchingCourses = allCourses.filter(course =>
        !query ||
        (course.title || '').toLowerCase().includes(query) ||
        (course.category || '').toLowerCase().includes(query) ||
        (course.description || '').toLowerCase().includes(query)
    );

    const hasMatchingNotes = matchingNotes.length > 0;
    const hasMatchingCourses = matchingCourses.length > 0;
    const isLoading = isLoadingNotes || isLoadingCourses;

    // Determine section visibility based on tab selection
    const showNotes = searchType === 'all' || searchType === 'notes';
    const showCourses = searchType === 'all' || searchType === 'courses';

    // If courses match but notes do NOT, bring courses section to the TOP!
    const coursesFirst = Boolean(query && !hasMatchingNotes && hasMatchingCourses);

    const notesSection = showNotes && (hasMatchingNotes || !query || searchType === 'notes' || !hasMatchingCourses) && (
        <PopularNotesGrid searchQuery={searchQuery} />
    );

    const coursesSection = showCourses && (hasMatchingCourses || !query || searchType === 'courses' || !hasMatchingNotes) && (
        <PopularCoursesGrid searchQuery={searchQuery} viewMode={viewMode} />
    );

    const noResultsFound = Boolean(query && !hasMatchingNotes && !hasMatchingCourses && !isLoading);

    return (
        <div className='max-w-7xl mx-auto space-y-12 pb-12'>
            <SearchFilterToolbar
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                showTypeFilter={true}
                searchType={searchType}
                onSearchTypeChange={setSearchType}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
            />

            {noResultsFound ? (
                <div className="text-center py-16 rounded-2xl bg-white dark:bg-[rgb(38,38,36)] border border-dashed border-gray-300 dark:border-gray-700 space-y-3">
                    <FileText className="w-14 h-14 mx-auto text-slate-400" />
                    <p className="text-lg font-bold text-slate-800 dark:text-slate-200">
                        No results found for "{searchQuery}"
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Try searching with a different topic, degree, or subject name.
                    </p>
                </div>
            ) : coursesFirst ? (
                <>
                    {coursesSection}
                    {notesSection}
                </>
            ) : (
                <>
                    {notesSection}
                    {coursesSection}
                </>
            )}
        </div>
    )
}

export default Page
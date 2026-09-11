"use client";
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Filter, Grid, List, Search } from 'lucide-react';

/**
 * SearchFilterToolbar - Reusable search, filter, and view mode toolbar
 * Styled similar to WelcomeContainer
 * 
 * Props:
 * - searchValue: current search query
 * - onSearchChange: (value) => void
 * - viewMode: 'grid' | 'list'
 * - onViewModeChange: (mode) => void
 * - onFilterClick: () => void (optional)
 */
const SearchFilterToolbar = ({
    searchValue = '',
    onSearchChange = () => { },
    showTypeFilter = false,
    searchType = 'all', // 'all' | 'notes' | 'courses'
    onSearchTypeChange = () => { },
    viewMode = 'grid',
    onViewModeChange = () => { },
}) => {
    return (
        <div className="mb-6 p-6 mt-5 rounded-2xl bg-white dark:bg-[rgb(38,38,36)] border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                {/* Search Bar */}
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500 dark:text-slate-400" />
                    <Input
                        placeholder="Search any note, topic, subject, or course (e.g., OS, Java, B.Tech)..."
                        value={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-12 h-12 text-base border shadow-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-[rgb(24,24,24)] text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 border-gray-300 dark:border-gray-600 rounded-xl"
                    />
                </div>

                {/* Filter Type Pills: All | Notes | Courses (Only displayed when showTypeFilter is true) */}
                <div className="flex items-center gap-2 flex-wrap">
                    {showTypeFilter && (
                        <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-[rgb(24,24,24)] border border-gray-200 dark:border-gray-700">
                            <button
                                type="button"
                                onClick={() => onSearchTypeChange('all')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${searchType === 'all'
                                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                All
                            </button>
                            <button
                                type="button"
                                onClick={() => onSearchTypeChange('notes')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${searchType === 'notes'
                                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                Notes
                            </button>
                            <button
                                type="button"
                                onClick={() => onSearchTypeChange('courses')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${searchType === 'courses'
                                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                Courses
                            </button>
                        </div>
                    )}

                    {/* View Mode Grid/List Toggle */}
                    <div className="flex rounded-xl overflow-hidden shadow-xs border border-gray-300 dark:border-gray-600">
                        <Button
                            variant={viewMode === "grid" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => onViewModeChange('grid')}
                            className={`rounded-none h-10 px-3.5 ${viewMode === "grid"
                                ? "bg-blue-600 text-white hover:bg-blue-700"
                                : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                                }`}
                        >
                            <Grid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === "list" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => onViewModeChange('list')}
                            className={`rounded-none h-10 px-3.5 ${viewMode === "list"
                                ? "bg-blue-600 text-white hover:bg-blue-700"
                                : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                                }`}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SearchFilterToolbar;

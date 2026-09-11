"use client"

import React, { useState } from 'react'
import AllNotesGrid from './_components/AllNotesGrid'
import SearchFilterToolbar from '@/app/(main)/_components/SearchFilterToolbar'

const page = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('grid');

    return (
       <div className=' max-w-7xl mx-auto space-y-12'>
            <SearchFilterToolbar
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onFilterClick={() => console.log('Filter clicked')}
            />
            <AllNotesGrid searchQuery={searchQuery} />
        </div>
    )
}

export default page

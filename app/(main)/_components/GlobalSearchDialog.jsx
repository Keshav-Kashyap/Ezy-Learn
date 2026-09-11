"use client"

import React, { useState, useEffect, useContext } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Search,
    BookOpen,
    FileText,
    Download,
    Share2,
    Lock,
    Loader2,
    TrendingUp,
    X
} from 'lucide-react'
import Link from 'next/link'
import { useCourses } from '@/hooks/useCourses'
import { UserDetailContext } from '@/context/UserDetailContext'
import { consumeCreditAndDownload } from '@/lib/downloadHelper'
import { toast } from 'sonner'

const GlobalSearchDialog = ({ isOpen, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('')
    const [notesResults, setNotesResults] = useState([])
    const [isSearching, setIsSearching] = useState(false)

    const { userDetail, setUserDetail } = useContext(UserDetailContext) || {}
    const isAdmin = userDetail?.role === 'admin'
    const isOutOfCredits = !isAdmin && (userDetail?.credits ?? 0) <= 0

    // Fetch real courses from React Query hook
    const { data: courses = [] } = useCourses()

    // Filter matching courses
    const filteredCourses = searchQuery.trim() ? (courses || []).filter(c =>
        (c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    ) : []

    // Fetch individual matching notes from real /api/search
    useEffect(() => {
        if (!searchQuery.trim()) {
            setNotesResults([])
            setIsSearching(false)
            return
        }

        const timer = setTimeout(async () => {
            setIsSearching(true)
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`)
                const data = await res.json()
                if (data.success) {
                    setNotesResults(data.results || [])
                }
            } catch (err) {
                console.error("Global search error:", err)
            } finally {
                setIsSearching(false)
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [searchQuery])

    const handleDownloadNote = (note, e) => {
        if (e) e.stopPropagation()
        consumeCreditAndDownload({
            fileUrl: note.fileUrl,
            fileName: note.title,
            fileType: note.type,
            materialId: note.id,
            userDetail,
            setUserDetail,
        })
    }

    const handleShareNote = (note, e) => {
        if (e) e.stopPropagation()
        if (navigator.share) {
            navigator.share({
                title: note.title,
                text: note.description,
                url: note.fileUrl
            })
            toast.success("Shared successfully!")
        } else {
            navigator.clipboard.writeText(note.fileUrl || window.location.href)
            toast.success("Link copied to clipboard!")
        }
    }

    const handleClose = () => {
        setSearchQuery('')
        setNotesResults([])
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 bg-white dark:bg-[rgb(38,38,36)]">
                <DialogHeader className="p-6 pb-4 border-b border-gray-200 dark:border-[rgb(45,45,44)]">
                    <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Search className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        Search Everything
                    </DialogTitle>
                </DialogHeader>

                {/* Search Input */}
                <div className="p-6 pt-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
                        <Input
                            type="text"
                            placeholder="Search any note, topic, subject, or course (e.g., OS, Java, B.Tech)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-12 py-6 text-lg bg-gray-50 dark:bg-[rgb(45,45,44)] border-2 border-gray-200 dark:border-[rgb(55,55,54)] focus:border-blue-500 dark:focus:border-blue-400"
                            autoFocus
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Search Results */}
                <div className="overflow-y-auto max-h-[calc(90vh-200px)] px-6 pb-6 space-y-6">
                    {searchQuery.trim() === '' ? (
                        <div className="text-center py-12">
                            <Search className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400 text-lg">
                                Start typing to search for notes, topics, or degree courses
                            </p>
                        </div>
                    ) : isSearching ? (
                        <div className="text-center py-12">
                            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-3" />
                            <p className="text-gray-500 dark:text-gray-400">Searching all study materials...</p>
                        </div>
                    ) : (
                        <>
                            {/* No Results */}
                            {filteredCourses.length === 0 && notesResults.length === 0 && (
                                <div className="text-center py-12">
                                    <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                    <p className="text-gray-500 dark:text-gray-400 text-lg">
                                        No results found for "{searchQuery}"
                                    </p>
                                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                                        Try searching with different keywords like OS, Java, DBMS, or B.Tech
                                    </p>
                                </div>
                            )}

                            {/* Notes Results */}
                            {notesResults.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                                Individual Study Notes & PDFs
                                            </h3>
                                        </div>
                                        <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                            {notesResults.length} Notes
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {notesResults.map((note) => {
                                            const contextBadge = note.parentCourse
                                                ? `${note.parentCourse}${note.parentSubject ? ' • ' + note.parentSubject : ''}`
                                                : 'Study Note'

                                            return (
                                                <Card key={note.id} className="p-4 hover:shadow-lg hover:border-blue-500 transition-all duration-300 bg-white dark:bg-[rgb(45,45,44)] border flex flex-col justify-between">
                                                    <div>
                                                        <div className="flex items-center justify-between gap-2 mb-2">
                                                            <Badge variant="outline" className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 max-w-[200px] truncate">
                                                                {contextBadge}
                                                            </Badge>
                                                            <Badge className="bg-blue-600 text-white text-[10px]">
                                                                {note.type || 'PDF'}
                                                            </Badge>
                                                        </div>

                                                        <h4 className="font-bold text-gray-900 dark:text-white text-base mb-1 line-clamp-2">
                                                            {note.title}
                                                        </h4>
                                                        {note.description && (
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                                                                {note.description}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="flex gap-2 items-center mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                                                        <Button
                                                            size="sm"
                                                            onClick={(e) => handleDownloadNote(note, e)}
                                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9"
                                                        >
                                                            {isOutOfCredits ? <Lock className="w-3.5 h-3.5 mr-1" /> : <Download className="w-3.5 h-3.5 mr-1" />}
                                                            Download
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={(e) => handleShareNote(note, e)}
                                                            className="h-9 px-3"
                                                        >
                                                            <Share2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                </Card>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Courses Results */}
                            {filteredCourses.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                                Matching Academic Courses
                                            </h3>
                                        </div>
                                        <Badge className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                                            {filteredCourses.length} Courses
                                        </Badge>
                                    </div>
                                    <div className="space-y-3">
                                        {filteredCourses.map((course) => (
                                            <Link
                                                key={course.id}
                                                href={`/library/${course.category}`}
                                                onClick={handleClose}
                                            >
                                                <Card className="p-4 hover:shadow-lg hover:border-indigo-500 transition-all duration-300 cursor-pointer bg-white dark:bg-[rgb(45,45,44)] border">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                                                                {course.title}
                                                            </h4>
                                                            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                                                <Badge variant="outline" className="text-xs">
                                                                    {course.category}
                                                                </Badge>
                                                                <span className="flex items-center gap-1">
                                                                    <FileText size={14} />
                                                                    {course.documents || 0} Documents
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <BookOpen className="w-8 h-8 text-indigo-600 dark:text-indigo-400 opacity-30" />
                                                    </div>
                                                </Card>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Quick Stats Footer */}
                {searchQuery.trim() !== '' && (filteredCourses.length > 0 || notesResults.length > 0) && (
                    <div className="p-4 border-t border-gray-200 dark:border-[rgb(45,45,44)] bg-gray-50 dark:bg-[rgb(45,45,44)]">
                        <div className="flex items-center justify-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center gap-2">
                                <TrendingUp size={16} className="text-blue-600 dark:text-blue-400" />
                                {notesResults.length + filteredCourses.length} Total Results Found
                            </span>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

export default GlobalSearchDialog


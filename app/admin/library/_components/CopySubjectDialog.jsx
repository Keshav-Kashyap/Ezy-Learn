"use client"

import React, { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Copy, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

const CopySubjectDialog = ({ isOpen, onClose, subject, onSuccess }) => {
    const [courses, setCourses] = useState([])
    const [selectedCourse, setSelectedCourse] = useState('')
    const [selectedSemester, setSelectedSemester] = useState('')
    const [loading, setLoading] = useState(false)
    const [fetchingCourses, setFetchingCourses] = useState(false)

    useEffect(() => {
        if (isOpen) {
            fetchCourses()
        }
    }, [isOpen])

    const fetchCourses = async () => {
        setFetchingCourses(true)
        try {
            const response = await fetch('/api/admin/courses/list')
            const result = await response.json()

            if (result.success) {
                // Filter out current course/semester
                const filteredCourses = result.courses.map(course => {
                    if (course.category === subject.category) {
                        // Same course - filter out current semester
                        return {
                            ...course,
                            semesters: course.semesters.filter(sem => sem.name !== subject.semesterName)
                        }
                    }
                    return course
                }).filter(course => course.semesters.length > 0) // Remove courses with no available semesters

                setCourses(filteredCourses)
            }
        } catch (error) {
            console.error('Error fetching courses:', error)
            toast.error('Failed to load courses')
        } finally {
            setFetchingCourses(false)
        }
    }

    const handleCopy = async () => {
        if (!selectedCourse || !selectedSemester) {
            toast.error('Please select both course and semester')
            return
        }

        setLoading(true)
        try {
            const response = await fetch('/api/admin/subjects/copy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subjectId: subject.id,
                    targetCourse: selectedCourse,
                    targetSemester: selectedSemester
                })
            })

            const result = await response.json()

            if (result.success) {
                toast.success(
                    `✅ ${result.data.materialsCopied} materials copied!`,
                    {
                        description: result.message
                    }
                )
                onClose()
                setTimeout(() => {
                    onSuccess?.()
                }, 50)
            } else {
                toast.error(result.error || 'Failed to copy subject')
            }
        } catch (error) {
            console.error('Error copying subject:', error)
            toast.error('Failed to copy subject')
        } finally {
            setLoading(false)
        }
    }

    const selectedCourseData = courses.find(c => c.category === selectedCourse)
    const availableSemesters = selectedCourseData?.semesters || []

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#2a2a28] border-[#3a3a38] text-white max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl text-white flex items-center gap-2">
                        <Copy className="h-5 w-5 text-blue-400" />
                        Copy Subject to Another Course
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Reuse "{subject?.name}" in another course/semester with all its materials
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                    {/* Current Location Info */}
                    <div className="bg-[#1a1a18] border border-[#3a3a38] rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">Currently in:</div>
                        <div className="text-white font-medium">
                            {subject?.category} → {subject?.semesterName}
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                            {subject?.code} • {subject?.credits || 0} Credits
                        </div>
                    </div>

                    {fetchingCourses ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                            <span className="ml-2 text-gray-400">Loading courses...</span>
                        </div>
                    ) : (
                        <>
                            {/* Select Course */}
                            <div className="space-y-2">
                                <Label className="text-white">Target Course *</Label>
                                <Select
                                    value={selectedCourse}
                                    onValueChange={(value) => {
                                        setSelectedCourse(value)
                                        setSelectedSemester('') // Reset semester when course changes
                                    }}
                                    disabled={loading}
                                >
                                    <SelectTrigger className="bg-[#1a1a18] border-[#3a3a38] text-white">
                                        <SelectValue placeholder="Select course" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1a1a18] border-[#3a3a38]">
                                        {courses.map((course) => (
                                            <SelectItem
                                                key={course.category}
                                                value={course.category}
                                                className="text-white hover:bg-[#2a2a28]"
                                            >
                                                {course.name} ({course.category})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Select Semester */}
                            <div className="space-y-2">
                                <Label className="text-white">Target Semester *</Label>
                                <Select
                                    value={selectedSemester}
                                    onValueChange={setSelectedSemester}
                                    disabled={!selectedCourse || loading}
                                >
                                    <SelectTrigger className="bg-[#1a1a18] border-[#3a3a38] text-white">
                                        <SelectValue placeholder="Select semester" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1a1a18] border-[#3a3a38]">
                                        {availableSemesters.map((semester) => (
                                            <SelectItem
                                                key={semester.id}
                                                value={semester.name}
                                                className="text-white hover:bg-[#2a2a28]"
                                            >
                                                {semester.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {!selectedCourse && (
                                    <p className="text-xs text-gray-500">Select a course first</p>
                                )}
                            </div>

                            {/* Info Box */}
                            {selectedCourse && selectedSemester && (
                                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                                    <div className="flex items-start gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                        <div className="text-xs text-blue-300">
                                            Subject and all its study materials will be available in <span className="font-semibold">{selectedCourse} → {selectedSemester}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                        <Button
                            variant="outline"
                            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="flex-1 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                            onClick={handleCopy}
                            disabled={loading || !selectedCourse || !selectedSemester || fetchingCourses}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Copying...
                                </>
                            ) : (
                                <>
                                    <Copy className="mr-2 h-4 w-4" />
                                    Copy Subject
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default CopySubjectDialog

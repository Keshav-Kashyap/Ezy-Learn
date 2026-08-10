"use client"

import React, { useState, useEffect } from 'react'
import {
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, FileText, Loader2, Link2 } from 'lucide-react'
import { toast } from 'sonner'

const FormUploadSyllabus = ({ onClose, onSuccess, prefilledCategory, prefilledSemester }) => {
    const [fileName, setFileName] = useState('')
    const [selectedFile, setSelectedFile] = useState(null)
    const [docTitle, setDocTitle] = useState('')
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [uploadMode, setUploadMode] = useState('file') // 'file' or 'link'
    const [fileUrl, setFileUrl] = useState('')

    // Course and Semester selection
    const [courses, setCourses] = useState([])
    const [semesters, setSemesters] = useState([])
    const [selectedCategory, setSelectedCategory] = useState(prefilledCategory || '')
    const [selectedSemester, setSelectedSemester] = useState(prefilledSemester || '')
    const [loadingCourses, setLoadingCourses] = useState(false)
    const [loadingSemesters, setLoadingSemesters] = useState(false)
    const [subjects, setSubjects] = useState([])
    const [loadingSubjects, setLoadingSubjects] = useState(false)

    // Fetch courses on mount
    useEffect(() => {
        fetchCourses()
    }, [])

    // Fetch semesters when category changes
    useEffect(() => {
        if (selectedCategory) {
            fetchSemesters(selectedCategory)
        } else {
            setSemesters([])
            setSelectedSemester('')
        }
    }, [selectedCategory])

    // Fetch subjects when semester changes
    useEffect(() => {
        if (selectedCategory && selectedSemester) {
            fetchSubjects(selectedCategory, selectedSemester)
        } else {
            setSubjects([])
        }
    }, [selectedCategory, selectedSemester])

    const fetchCourses = async () => {
        setLoadingCourses(true)
        try {
            const response = await fetch('/api/courses')
            const result = await response.json()
            if (result.success) {
                setCourses(result.data || [])
            }
        } catch (error) {
            console.error('Error fetching courses:', error)
            toast.error('Failed to load courses')
        } finally {
            setLoadingCourses(false)
        }
    }

    const fetchSemesters = async (category) => {
        setLoadingSemesters(true)
        try {
            const response = await fetch(`/api/admin/semesters?category=${category}`)
            const result = await response.json()
            if (result.success) {
                setSemesters(result.data || [])
            }
        } catch (error) {
            console.error('Error fetching semesters:', error)
            toast.error('Failed to load semesters')
        } finally {
            setLoadingSemesters(false)
        }
    }

    const fetchSubjects = async (category, semesterName) => {
        setLoadingSubjects(true)
        try {
            const response = await fetch('/api/admin/subjects/all')
            const result = await response.json()
            if (result.success) {
                const filtered = (result.subjects || []).filter(
                    s => s.category === category && s.semesterName === semesterName
                )
                setSubjects(filtered)
            }
        } catch (error) {
            console.error('Error fetching subjects:', error)
        } finally {
            setLoadingSubjects(false)
        }
    }

    const handleFileChange = (e) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.type !== 'application/pdf') {
                toast.error('Please select a PDF file only')
                return
            }

            setFileName(file.name)
            setSelectedFile(file)
            toast.success(`Selected: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`)
        }
    }

    const handleSubmit = async () => {
        // Validation
        if (!docTitle.trim()) {
            toast.error('Please enter syllabus title')
            return
        }

        if (!selectedCategory) {
            toast.error('Please select a course')
            return
        }

        if (!selectedSemester) {
            toast.error('Please select a semester')
            return
        }

        if (uploadMode === 'file' && !selectedFile) {
            toast.error('Please select a PDF file')
            return
        }

        if (uploadMode === 'link' && !fileUrl.trim()) {
            toast.error('Please enter a valid PDF link')
            return
        }

        if (subjects.length === 0) {
            toast.error('No subjects found for selected course and semester')
            return
        }

        setUploading(true)
        setUploadProgress(0)

        try {
            const subjectIds = subjects.map(s => s.id)

            if (uploadMode === 'link') {
                // Handle link-based upload
                const response = await fetch('/api/admin/upload-link', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: docTitle.trim(),
                        fileUrl: fileUrl.trim(),
                        subjectIds: subjectIds,
                        type: 'SYLLABUS'
                    })
                })

                const result = await response.json()

                if (result.success) {
                    setUploadProgress(100)
                    toast.success(`Syllabus uploaded for ${selectedSemester}!`)

                    // Reset form
                    setDocTitle('')
                    setFileUrl('')
                    setSelectedFile(null)
                    setFileName('')
                    if (!prefilledCategory) {
                        setSelectedCategory('')
                        setSelectedSemester('')
                    }

                    if (onClose) {
                        onClose()
                    }
                    setTimeout(() => {
                        if (onSuccess) {
                            onSuccess()
                        }
                    }, 50)
                } else {
                    throw new Error(result.error || 'Failed to upload syllabus')
                }
            } else {
                // Handle file upload with progress
                const formData = new FormData()
                formData.append('file', selectedFile)
                formData.append('title', docTitle.trim())
                formData.append('fileName', selectedFile.name)
                formData.append('fileSize', selectedFile.size.toString())
                formData.append('fileType', selectedFile.type)
                formData.append('type', 'SYLLABUS')
                formData.append('subjectIds', JSON.stringify(subjectIds))

                const xhr = new XMLHttpRequest()

                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const percentComplete = Math.round((e.loaded / e.total) * 100)
                        setUploadProgress(percentComplete)
                    }
                })

                const uploadPromise = new Promise((resolve, reject) => {
                    xhr.addEventListener('load', () => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            try {
                                const result = JSON.parse(xhr.responseText)
                                resolve(result)
                            } catch (error) {
                                reject(new Error('Invalid response format'))
                            }
                        } else {
                            reject(new Error(`Upload failed with status ${xhr.status}`))
                        }
                    })

                    xhr.addEventListener('error', () => {
                        reject(new Error('Network error during upload'))
                    })

                    xhr.addEventListener('abort', () => {
                        reject(new Error('Upload cancelled'))
                    })

                    xhr.open('POST', '/api/admin/upload')
                    xhr.send(formData)
                })

                const result = await uploadPromise

                if (result.success) {
                    setUploadProgress(100)
                    toast.success(`Syllabus uploaded for ${selectedSemester}!`)

                    // Reset form
                    setDocTitle('')
                    setFileName('')
                    setSelectedFile(null)
                    if (!prefilledCategory) {
                        setSelectedCategory('')
                        setSelectedSemester('')
                    }

                    if (onClose) {
                        onClose()
                    }
                    setTimeout(() => {
                        if (onSuccess) {
                            onSuccess()
                        }
                    }, 50)
                } else {
                    throw new Error(result.error || 'Upload failed')
                }
            }
        } catch (error) {
            console.error('Upload error:', error)
            toast.error(error.message || 'Failed to upload syllabus')
        } finally {
            setUploading(false)
            setUploadProgress(0)
        }
    }

    return (
        <DialogContent className="bg-[#2a2a28] border-[#3a3a38] text-white max-w-xl">
            <DialogHeader>
                <DialogTitle className="text-2xl text-white">Upload Syllabus</DialogTitle>
                <DialogDescription className="text-gray-400">
                    Upload course syllabus for a semester
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 mt-4">
                {/* Course Selection */}
                <div className="space-y-2">
                    <Label className="text-white">Select Course *</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={uploading || loadingCourses || prefilledCategory}>
                        <SelectTrigger className="bg-[#1a1a18] border-[#3a3a38] text-white">
                            <SelectValue placeholder="Choose a course" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a18] border-[#3a3a38] text-white">
                            {courses.map(course => (
                                <SelectItem key={course.id} value={course.category}>
                                    {course.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Semester Selection */}
                <div className="space-y-2">
                    <Label className="text-white">Select Semester *</Label>
                    <Select value={selectedSemester} onValueChange={setSelectedSemester} disabled={!selectedCategory || uploading || loadingSemesters || prefilledSemester}>
                        <SelectTrigger className="bg-[#1a1a18] border-[#3a3a38] text-white">
                            <SelectValue placeholder="Choose a semester" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a18] border-[#3a3a38] text-white">
                            {semesters.map(sem => (
                                <SelectItem key={sem.id} value={sem.name}>
                                    {sem.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {selectedCategory && selectedSemester && subjects.length > 0 && (
                        <p className="text-xs text-green-400">
                            ✓ Found {subjects.length} subjects in this semester
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="doc-title" className="text-white">Syllabus Title *</Label>
                    <Input
                        id="doc-title"
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                        placeholder="e.g., MCA Semester 1 Syllabus"
                        className="bg-[#1a1a18] border-[#3a3a38] text-white placeholder:text-gray-500 focus:border-gray-500"
                        disabled={uploading}
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="pdf-upload" className="text-white">
                            {uploadMode === 'file' ? 'Upload PDF *' : 'PDF Link *'}
                        </Label>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setUploadMode(uploadMode === 'file' ? 'link' : 'file')
                                setSelectedFile(null)
                                setFileName('')
                                setFileUrl('')
                            }}
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                            disabled={uploading}
                        >
                            {uploadMode === 'file' ? (
                                <>
                                    <Link2 className="h-4 w-4 mr-1" />
                                    Upload via Link
                                </>
                            ) : (
                                <>
                                    <Upload className="h-4 w-4 mr-1" />
                                    Upload File
                                </>
                            )}
                        </Button>
                    </div>

                    {uploadMode === 'link' ? (
                        <div className="space-y-2">
                            <Input
                                value={fileUrl}
                                onChange={(e) => setFileUrl(e.target.value)}
                                placeholder="https://example.com/syllabus.pdf or Google Drive link"
                                className="bg-[#1a1a18] border-[#3a3a38] text-white placeholder:text-gray-500 focus:border-gray-500"
                                disabled={uploading}
                            />
                            <p className="text-xs text-gray-500">
                                Paste a direct link to PDF file. Google Drive links will be auto-converted.
                            </p>
                        </div>
                    ) : (
                        <div className="relative">
                            <Input
                                id="pdf-upload"
                                type="file"
                                accept=".pdf"
                                onChange={handleFileChange}
                                className="hidden"
                                disabled={uploading}
                            />
                            <label
                                htmlFor="pdf-upload"
                                className={`flex items-center justify-center w-full h-32 border-2 border-dashed border-[#3a3a38] rounded-lg cursor-pointer hover:border-gray-500 transition-colors bg-[#1a1a18] ${uploading ? 'pointer-events-none opacity-50' : ''}`}
                            >
                                <div className="text-center w-full px-4">
                                    {uploading ? (
                                        <>
                                            <Loader2 className="mx-auto h-10 w-10 text-blue-400 mb-2 animate-spin" />
                                            <div className="w-full max-w-xs mx-auto mt-2">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm text-gray-400">Uploading...</span>
                                                    <span className="text-sm font-bold text-blue-400">{uploadProgress}%</span>
                                                </div>
                                                <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                                                        style={{ width: `${uploadProgress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <Upload className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                                    )}

                                    {fileName && !uploading ? (
                                        <div className="flex items-center justify-center gap-2 text-white">
                                            <FileText className="h-4 w-4" />
                                            <span className="text-sm">{fileName}</span>
                                        </div>
                                    ) : !uploading && (
                                        <>
                                            <p className="text-sm text-gray-400">
                                                Click to upload PDF
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">or drag and drop</p>
                                        </>
                                    )}
                                </div>
                            </label>
                        </div>
                    )}
                </div>

                <div className="flex gap-3 pt-4">
                    <Button
                        variant="outline"
                        className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                        onClick={onClose}
                        disabled={uploading}
                    >
                        Cancel
                    </Button>
                    <Button
                        className="flex-1 bg-white text-black hover:bg-gray-200 disabled:opacity-50"
                        onClick={handleSubmit}
                        disabled={uploading || !selectedCategory || !selectedSemester || (uploadMode === 'file' ? !selectedFile : !fileUrl.trim()) || !docTitle.trim()}
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {uploadMode === 'link' ? 'Adding...' : 'Uploading...'}
                            </>
                        ) : (
                            `Upload Syllabus`
                        )}
                    </Button>
                </div>
            </div>
        </DialogContent>
    )
}

export default FormUploadSyllabus

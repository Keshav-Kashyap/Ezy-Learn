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
import { Upload, FileText, Loader2, Check, X, Link2, HardDrive, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'


const FormCreateMaterial = ({ onClose, onSuccess, prefilledSubjectCode, editMode = false, materialData = null }) => {
    const [fileName, setFileName] = useState('')
    const [selectedFile, setSelectedFile] = useState(null)
    const [courseCode, setCourseCode] = useState(prefilledSubjectCode || '')
    const [docTitle, setDocTitle] = useState('')
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [uploadMode, setUploadMode] = useState('file') // 'file' or 'link'
    const [uploadStorage, setUploadStorage] = useState('supabase') // 'supabase', 'appwrite', or 'googledrive'
    const [isSyncingFolders, setIsSyncingFolders] = useState(false)
    const [driveStatus, setDriveStatus] = useState({ isConfigured: false, hasRefreshToken: false, authUrl: null })

    const fetchDriveStatus = async () => {
        try {
            const res = await fetch('/api/admin/google/status')
            const contentType = res.headers.get('content-type')
            if (res.ok && contentType && contentType.includes('application/json')) {
                const data = await res.json()
                if (data.success) {
                    setDriveStatus(data)
                }
            }
        } catch (err) {
            console.error("Failed to check Google Drive status:", err)
        }
    }

    useEffect(() => {
        fetchDriveStatus()
    }, [uploadStorage])

    const handleSyncDriveFolders = async () => {
        setIsSyncingFolders(true)
        try {
            const res = await fetch('/api/admin/googledrive/sync-folders', { method: 'POST' })
            const contentType = res.headers.get('content-type')
            if (!contentType || !contentType.includes('application/json')) {
                const errText = await res.text()
                throw new Error(errText.includes('Refresh Token missing') ? 'Google Drive Refresh Token missing. Set GOOGLE_REFRESH_TOKEN in .env' : 'Server returned error')
            }
            const data = await res.json()
            if (data.success) {
                toast.success(`Google Drive Folders Synced! ${data.data.totalFoldersSynced} subject folders created/verified.`)
            } else {
                toast.error(data.error || 'Failed to sync Google Drive folders.')
            }
        } catch (err) {
            console.error("Folder sync error:", err)
            toast.error(err.message || "Error syncing Google Drive folders")
        } finally {
            setIsSyncingFolders(false)
        }
    }


    const [fileUrl, setFileUrl] = useState('')
    const [isPopular, setIsPopular] = useState(false)
    const [thumbnailUrl, setThumbnailUrl] = useState('')
    const [thumbnailMode, setThumbnailMode] = useState('url') // 'url' or 'file'
    const [thumbnailFile, setThumbnailFile] = useState(null)
    const [thumbnailFileName, setThumbnailFileName] = useState('')
    const [materialId, setMaterialId] = useState(null)

    // Multi-select state
    const [allSubjects, setAllSubjects] = useState([])
    const [selectedSubjects, setSelectedSubjects] = useState([])
    const [loadingSubjects, setLoadingSubjects] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [showDropdown, setShowDropdown] = useState(false)

    // Fetch all subjects on mount
    useEffect(() => {
        fetchAllSubjects()
    }, [])

    // Populate form when in edit mode
    useEffect(() => {
        if (editMode && materialData) {
            setMaterialId(materialData.id)
            setDocTitle(materialData.title || '')
            setFileUrl(materialData.fileUrl || '')
            setUploadMode('link') // Edit mode uses link

            // Check if material is popular from tags
            try {
                const tags = materialData.tags ? JSON.parse(materialData.tags) : []
                setIsPopular(tags.includes('popular'))
            } catch (e) {
                setIsPopular(materialData.isPopular || false)
            }

            // Set thumbnail
            if (materialData.imageUrl) {
                setThumbnailUrl(materialData.imageUrl)
                setThumbnailMode('url')
            }
        }
    }, [editMode, materialData])

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.subject-dropdown-container')) {
                setShowDropdown(false)
            }
        }
        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [])

    const fetchAllSubjects = async () => {
        setLoadingSubjects(true)
        try {
            const response = await fetch('/api/admin/subjects/all')
            const result = await response.json()

            if (result.success) {
                const subjects = Array.isArray(result.subjects) ? result.subjects : []
                setAllSubjects(subjects)

                // Auto-select if prefilled subject code
                if (prefilledSubjectCode && subjects.length > 0) {
                    const matchingSubject = subjects.find(
                        s => s && s.code && s.code.toUpperCase() === prefilledSubjectCode.toUpperCase()
                    )
                    if (matchingSubject) {
                        setSelectedSubjects([matchingSubject])
                    }
                }
            } else {
                toast.error(result.error || 'Failed to load subjects')
                setAllSubjects([])
            }
        } catch (error) {
            console.error('Error fetching subjects:', error)
            toast.error('Failed to load subjects')
            setAllSubjects([])
        } finally {
            setLoadingSubjects(false)
        }
    }

    const toggleSubjectSelection = (subject) => {
        setSelectedSubjects(prev => {
            const exists = prev.find(s => s.id === subject.id)
            if (exists) {
                return prev.filter(s => s.id !== subject.id)
            } else {
                return [...prev, subject]
            }
        })
    }

    const removeSubject = (subjectId) => {
        setSelectedSubjects(prev => prev.filter(s => s.id !== subjectId))
    }

    const filteredSubjects = allSubjects.filter(subject => {
        const search = searchTerm.toLowerCase()
        return (
            subject.name.toLowerCase().includes(search) ||
            subject.code.toLowerCase().includes(search) ||
            subject.category.toLowerCase().includes(search) ||
            subject.semesterName.toLowerCase().includes(search)
        )
    })

    const handleFileChange = (e) => {
        const file = e.target.files?.[0]
        if (file) {
            // Validate file type
            if (file.type !== 'application/pdf') {
                toast.error('Please select a PDF file only')
                return
            }

            // No file size limit for admin - they can upload any size
            setFileName(file.name)
            setSelectedFile(file)
            toast.success(`Selected: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`)
        }
    }

    const handleSubmit = async () => {
        // Validation
        if (!docTitle.trim()) {
            toast.error('Please enter document title')
            return
        }

        if (uploadMode === 'file' && !selectedFile && !editMode) {
            toast.error('Please select a PDF file')
            return
        }

        if (uploadMode === 'link' && !fileUrl.trim()) {
            toast.error('Please enter a valid PDF link')
            return
        }

        if (selectedSubjects.length === 0 && !editMode) {
            toast.error('Please select at least one subject')
            return
        }

        setUploading(true)
        setUploadProgress(0)

        try {
            if (uploadMode === 'link') {
                // Handle link-based upload or update
                const endpoint = editMode ? '/api/admin/materials' : '/api/admin/upload-link';
                const method = editMode ? 'PUT' : 'POST';

                const requestBody = editMode ? {
                    id: materialId,
                    title: docTitle.trim(),
                    fileUrl: fileUrl.trim(),
                    imageUrl: thumbnailUrl || null,
                    isPopular: isPopular,
                    // Update tags for popular status
                    tags: (() => {
                        try {
                            const existingTags = materialData?.tags ? JSON.parse(materialData.tags) : [];
                            const filteredTags = existingTags.filter(t => t !== 'popular');
                            if (isPopular && !filteredTags.includes('popular')) {
                                filteredTags.push('popular');
                            }
                            return JSON.stringify(filteredTags);
                        } catch (e) {
                            return JSON.stringify(isPopular ? ['popular'] : []);
                        }
                    })()
                } : {
                    title: docTitle.trim(),
                    fileUrl: fileUrl.trim(),
                    subjectIds: selectedSubjects.map(s => s.id),
                    courseCode: selectedSubjects[0]?.code || '',
                    isPopular: isPopular,
                    imageUrl: thumbnailUrl || ''
                };

                const response = await fetch(endpoint, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                })

                const result = await response.json()

                if (result.success) {
                    setUploadProgress(100)
                    toast.success(editMode ? 'Material updated successfully!' : `Material added to ${selectedSubjects.length} subject(s)!`)

                    // Reset form
                    setDocTitle('')
                    setFileUrl('')
                    setSelectedFile(null)
                    setFileName('')
                    setThumbnailUrl('')
                    setThumbnailFile(null)
                    setThumbnailFileName('')
                    if (!prefilledSubjectCode && !editMode) {
                        setSelectedSubjects([])
                        setCourseCode('')
                    }

                    // Close modal first and refresh data
                    if (onClose) {
                        onClose()
                    }
                    setTimeout(() => {
                        if (onSuccess) {
                            onSuccess()
                        }
                    }, 50)
                } else {
                    throw new Error(result.error || 'Failed to add material')
                }
            } else {
                // Handle file upload with progress
                const formData = new FormData()
                formData.append('file', selectedFile)
                formData.append('title', docTitle.trim())
                formData.append('fileName', selectedFile.name)
                formData.append('fileSize', selectedFile.size.toString())
                formData.append('fileType', selectedFile.type)

                // Handle thumbnail - either URL or file
                if (thumbnailMode === 'file' && thumbnailFile) {
                    formData.append('thumbnailFile', thumbnailFile)
                } else if (thumbnailMode === 'url' && thumbnailUrl) {
                    formData.append('imageUrl', thumbnailUrl)
                }

                formData.append('isPopular', isPopular.toString())
                formData.append('subjectIds', JSON.stringify(selectedSubjects.map(s => s.id)))

                if (selectedSubjects.length > 0) {
                    formData.append('courseCode', selectedSubjects[0].code)
                }

                // Choose endpoint based on storage selection
                const uploadEndpoint = uploadStorage === 'googledrive'
                    ? '/api/admin/upload-googledrive'
                    : uploadStorage === 'appwrite'
                        ? '/api/admin/upload-appwrite'
                        : '/api/admin/upload';

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
                            try {
                                const errResult = JSON.parse(xhr.responseText)
                                reject(new Error(errResult.error || errResult.message || `Upload failed with status ${xhr.status}`))
                            } catch (e) {
                                reject(new Error(`Upload failed with status ${xhr.status}`))
                            }
                        }
                    })

                    xhr.addEventListener('error', () => {
                        reject(new Error('Network error during upload'))
                    })

                    xhr.addEventListener('abort', () => {
                        reject(new Error('Upload cancelled'))
                    })

                    xhr.open('POST', uploadEndpoint)
                    xhr.send(formData)
                })

                const result = await uploadPromise

                if (result.success) {
                    setUploadProgress(100)
                    const storageType = uploadStorage === 'googledrive' ? 'Google Drive' : uploadStorage === 'appwrite' ? 'Appwrite' : 'Supabase';
                    toast.success(result.message || `Material uploaded to ${storageType} and assigned to ${selectedSubjects.length} subject(s)!`)


                    // Reset form
                    setDocTitle('')
                    setFileName('')
                    setSelectedFile(null)
                    setThumbnailUrl('')
                    setThumbnailFile(null)
                    setThumbnailFileName('')
                    if (!prefilledSubjectCode) {
                        setSelectedSubjects([])
                        setCourseCode('')
                    }

                    // Close modal first and refresh data
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
            toast.error(error.message || 'Failed to upload material')
        } finally {
            setUploading(false)
            setUploadProgress(0)
        }
    }

    return (
        <DialogContent className="bg-white dark:bg-[#2a2a28] border-gray-200 dark:border-[#3a3a38] text-gray-900 dark:text-white max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle className="text-2xl text-gray-900 dark:text-white">
                    {editMode ? 'Edit Material' : 'Upload Material'}
                </DialogTitle>
                <DialogDescription className="text-gray-600 dark:text-gray-400">
                    {editMode ? 'Update material information' : 'Add course materials to Supabase or Appwrite storage'}
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
                {/* Subject Multi-Select */}
                {!editMode && (
                    <div className="space-y-2">
                        <Label className="text-gray-900 dark:text-white">
                            Select Subjects *
                            {prefilledSubjectCode && <span className="text-gray-500 text-xs ml-2">(Pre-selected)</span>}
                        </Label>

                        {/* Selected Subjects Display */}
                        {selectedSubjects.length > 0 && (
                            <div className="flex flex-wrap gap-2 p-2 bg-gray-50 dark:bg-[#1a1a18] border border-gray-300 dark:border-[#3a3a38] rounded-lg">
                                {selectedSubjects.map(subject => (
                                    <div
                                        key={subject.id}
                                        className="flex items-center gap-1 bg-blue-600 text-white px-2 py-1 rounded text-sm"
                                    >
                                        <span>{subject.code} - {subject.name}</span>
                                        {!prefilledSubjectCode && (
                                            <button
                                                onClick={() => removeSubject(subject.id)}
                                                className="hover:bg-blue-700 rounded"
                                                disabled={uploading}
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Subject Search & Dropdown */}
                        {!prefilledSubjectCode && (
                            <div className="relative subject-dropdown-container">
                                <Input
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value)
                                        setShowDropdown(true)
                                    }}
                                    onFocus={() => setShowDropdown(true)}
                                    placeholder="Search subjects by name, code, course..."
                                    className="bg-white dark:bg-[#1a1a18] border-gray-300 dark:border-[#3a3a38] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                    disabled={uploading || loadingSubjects}
                                />

                                {/* Dropdown */}
                                {showDropdown && filteredSubjects.length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto bg-[#1a1a18] border border-[#3a3a38] rounded-lg shadow-lg">
                                        {filteredSubjects.map(subject => {
                                            const isSelected = selectedSubjects.find(s => s.id === subject.id)
                                            return (
                                                <div
                                                    key={subject.id}
                                                    onClick={() => toggleSubjectSelection(subject)}
                                                    className="flex items-center justify-between px-3 py-2 hover:bg-[#2a2a28] cursor-pointer border-b border-[#3a3a38] last:border-b-0"
                                                >
                                                    <div className="flex-1">
                                                        <div className="text-white text-sm font-medium">
                                                            {subject.code} - {subject.name}
                                                        </div>
                                                        <div className="text-gray-500 text-xs">
                                                            {subject.category} • {subject.semesterName}
                                                        </div>
                                                    </div>
                                                    {isSelected && (
                                                        <Check className="h-4 w-4 text-blue-500" />
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        <p className="text-xs text-gray-500">
                            {selectedSubjects.length === 0
                                ? 'Search and select subjects where this material will be available'
                                : `Selected ${selectedSubjects.length} subject(s). Material will appear in all selected subjects.`
                            }
                        </p>
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="doc-title" className="text-gray-900 dark:text-white">Document Title *</Label>
                    <Input
                        id="doc-title"
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                        placeholder="e.g., Lecture Notes - Chapter 5"
                        className="bg-white dark:bg-[#1a1a18] border-gray-300 dark:border-[#3a3a38] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        disabled={uploading}
                    />
                </div>

                {/* Popular Status Checkbox */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="is-popular"
                            checked={isPopular}
                            onChange={(e) => setIsPopular(e.target.checked)}
                            disabled={uploading}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <Label htmlFor="is-popular" className="text-gray-900 dark:text-white cursor-pointer">
                            Mark as Popular Note
                        </Label>
                    </div>
                    <p className="text-xs text-gray-500">
                        Popular notes will be featured on homepage and library
                    </p>
                </div>

                {/* Storage Selection - Only for file upload mode */}
                {!editMode && uploadMode === 'file' && (
                    <div className="space-y-2">
                        <Label className="text-gray-900 dark:text-white font-semibold">Storage Provider *</Label>
                        <div className="grid grid-cols-3 gap-2">
                            <Button
                                type="button"
                                variant={uploadStorage === 'supabase' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setUploadStorage('supabase')}
                                className={uploadStorage === 'supabase' 
                                    ? 'bg-green-600 text-white hover:bg-green-700 shadow-md font-bold' 
                                    : 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}
                                disabled={uploading}
                            >
                                <Upload className="h-4 w-4 mr-1" />
                                Supabase
                            </Button>
                            <Button
                                type="button"
                                variant={uploadStorage === 'appwrite' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setUploadStorage('appwrite')}
                                className={uploadStorage === 'appwrite' 
                                    ? 'bg-pink-600 text-white hover:bg-pink-700 shadow-md font-bold' 
                                    : 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}
                                disabled={uploading}
                            >
                                <Upload className="h-4 w-4 mr-1" />
                                Appwrite
                            </Button>
                            <Button
                                type="button"
                                variant={uploadStorage === 'googledrive' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setUploadStorage('googledrive')}
                                className={uploadStorage === 'googledrive' 
                                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md font-bold' 
                                    : 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}
                                disabled={uploading}
                            >
                                <HardDrive className="h-4 w-4 mr-1 text-amber-300" />
                                Google Drive
                            </Button>
                        </div>
                        <p className="text-xs text-gray-500">
                            {uploading && <Loader2 className="inline h-3 w-3 mr-1 animate-spin" />}
                            {uploading
                                ? `Uploading to ${uploadStorage === 'googledrive' ? 'Google Drive' : uploadStorage === 'appwrite' ? 'Appwrite' : 'Supabase'}...`
                                : uploadStorage === 'googledrive'
                                    ? 'Files will be saved directly into Course > Semester > Subject folder on Google Drive'
                                    : 'Choose where to store the uploaded file'}
                        </p>
                    </div>
                )}

                {/* Thumbnail Image - Optional */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between mb-2">
                        <Label className="text-white">
                            Thumbnail Image (Optional)
                        </Label>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setThumbnailMode(thumbnailMode === 'url' ? 'file' : 'url')
                                setThumbnailUrl('')
                                setThumbnailFile(null)
                                setThumbnailFileName('')
                            }}
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                            disabled={uploading}
                        >
                            {thumbnailMode === 'url' ? (
                                <>
                                    <Upload className="h-4 w-4 mr-1" />
                                    Upload File
                                </>
                            ) : (
                                <>
                                    <Link2 className="h-4 w-4 mr-1" />
                                    Use URL
                                </>
                            )}
                        </Button>
                    </div>

                    {thumbnailMode === 'url' ? (
                        <div className="space-y-2">
                            <Input
                                type="url"
                                value={thumbnailUrl}
                                onChange={(e) => setThumbnailUrl(e.target.value)}
                                placeholder="https://example.com/thumbnail.jpg"
                                className="bg-white dark:bg-[#1a1a18] border-gray-300 dark:border-[#3a3a38] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                disabled={uploading}
                            />
                            <p className="text-xs text-gray-500">
                                Paste a direct link to thumbnail image
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                        setThumbnailFile(file)
                                        setThumbnailFileName(file.name)
                                    }
                                }}
                                className="bg-[#1a1a18] border-[#3a3a38] text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer"
                                disabled={uploading}
                            />
                            {thumbnailFileName && (
                                <div className="flex items-center gap-2 text-sm text-green-400">
                                    <Check className="h-4 w-4" />
                                    <span>{thumbnailFileName}</span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setThumbnailFile(null)
                                            setThumbnailFileName('')
                                        }}
                                        disabled={uploading}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                            <p className="text-xs text-gray-500">
                                Upload thumbnail image (JPG, PNG, GIF, WebP)
                            </p>
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="pdf-upload" className="text-white">
                            {uploadMode === 'file' ? 'Upload PDF * (No Size Limit)' : 'PDF Link *'}
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
                                placeholder="https://example.com/document.pdf or Google Drive link"
                                className="bg-white dark:bg-[#1a1a18] border-gray-300 dark:border-[#3a3a38] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
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
                                className={`flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-[#3a3a38] rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-gray-500 transition-colors bg-gray-50 dark:bg-[#1a1a18] ${uploading ? 'pointer-events-none opacity-50' : ''}`}
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

                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
                    <Button
                        variant="outline"
                        className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium"
                        onClick={onClose}
                        disabled={uploading}
                    >
                        Cancel
                    </Button>
                    <Button
                        className="flex-1 bg-blue-600 text-white hover:bg-blue-700 dark:bg-white dark:text-black dark:hover:bg-gray-200 disabled:opacity-50 font-medium shadow-md"
                        onClick={handleSubmit}
                        disabled={uploading || (uploadMode === 'file' && !selectedFile && !editMode) || (uploadMode === 'link' && !fileUrl.trim()) || (selectedSubjects.length === 0 && !editMode) || !docTitle.trim()}
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {editMode ? 'Updating...' : (uploadMode === 'link' ? 'Adding...' : `Uploading (${uploadProgress}%)`)}
                            </>
                        ) : (
                            <>
                                <Upload className="mr-2 h-4 w-4" />
                                {editMode
                                    ? 'Update Material'
                                    : `${uploadMode === 'link' ? 'Add' : 'Upload'} to ${selectedSubjects.length} Subject(s)`}
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </DialogContent>
    )
}

export default FormCreateMaterial
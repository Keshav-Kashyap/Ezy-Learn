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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'

const EditSubjectDialog = ({ subject, open, onOpenChange, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        credits: 4
    })
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (subject && open) {
            setFormData({
                name: subject.name || '',
                code: subject.code || '',
                description: subject.description || '',
                credits: subject.credits || 4
            })
        }
    }, [subject, open])

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.name.trim() || !formData.code.trim()) {
            toast.error('Please fill in all required fields')
            return
        }

        setLoading(true)

        try {
            const response = await fetch(`/api/admin/subjects/${subject.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const result = await response.json()

            if (result.success) {
                toast.success('Subject updated successfully!')
                onOpenChange(false)
                setTimeout(() => {
                    onSuccess?.()
                }, 50)
            } else {
                throw new Error(result.error || 'Failed to update subject')
            }
        } catch (error) {
            console.error('Update error:', error)
            toast.error(error.message || 'Failed to update subject')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white dark:bg-[#2a2a28] border dark:border-[#3a3a38] max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl text-gray-900 dark:text-white">
                        Edit Subject
                    </DialogTitle>
                    <DialogDescription className="text-gray-600 dark:text-gray-400">
                        Update subject information
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-gray-900 dark:text-white">
                            Subject Name *
                        </Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Data Structures and Algorithms"
                            className="bg-gray-50 dark:bg-[#1a1a18] border-gray-200 dark:border-[#3a3a38]"
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="code" className="text-gray-900 dark:text-white">
                            Subject Code *
                        </Label>
                        <Input
                            id="code"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                            placeholder="e.g., CS101"
                            className="bg-gray-50 dark:bg-[#1a1a18] border-gray-200 dark:border-[#3a3a38]"
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="credits" className="text-gray-900 dark:text-white">
                            Credits *
                        </Label>
                        <Input
                            id="credits"
                            type="number"
                            min="1"
                            max="10"
                            value={formData.credits}
                            onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) || 1 })}
                            className="bg-gray-50 dark:bg-[#1a1a18] border-gray-200 dark:border-[#3a3a38]"
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-gray-900 dark:text-white">
                            Description
                        </Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Subject description..."
                            className="bg-gray-50 dark:bg-[#1a1a18] border-gray-200 dark:border-[#3a3a38] min-h-[100px]"
                            disabled={loading}
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default EditSubjectDialog

"use client"

import React, { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const DeleteConfirmDialog = ({
    open,
    onOpenChange,
    onConfirm,
    title = "Confirm Delete",
    description,
    itemId,
    endpoint
}) => {
    const [loading, setLoading] = useState(false)

    const handleDelete = async () => {
        setLoading(true)

        try {
            const response = await fetch(`${endpoint}/${itemId}`, {
                method: 'DELETE'
            })

            const result = await response.json()

            if (result.success) {
                toast.success('Deleted successfully!')
                onOpenChange(false)
                setTimeout(() => {
                    onConfirm?.()
                }, 50)
            } else {
                throw new Error(result.error || 'Failed to delete')
            }
        } catch (error) {
            console.error('Delete error:', error)
            toast.error(error.message || 'Failed to delete')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white dark:bg-[#2a2a28] border dark:border-[#3a3a38] max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl text-gray-900 dark:text-white">
                                {title}
                            </DialogTitle>
                        </div>
                    </div>
                    <DialogDescription className="text-gray-600 dark:text-gray-400 mt-4">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="mt-6">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={loading}
                        className="flex-1 bg-red-600 hover:bg-red-700"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            'Delete'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default DeleteConfirmDialog

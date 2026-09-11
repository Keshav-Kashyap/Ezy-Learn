"use client"

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
    CheckSquare,
    Square,
    Power,
    PowerOff,
    Trash2,
    Loader2,
    AlertTriangle
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from 'sonner';

const SemesterBulkActions = ({
    semesters = [],
    selectedSemesters = [],
    onSelectAll,
    onUpdate
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showActivateDialog, setShowActivateDialog] = useState(false);
    const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);

    const selectedCount = selectedSemesters.length;
    const allSelected = selectedCount === semesters.length && semesters.length > 0;

    const handleBulkActivate = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/admin/semesters/bulk-activate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ semesterIds: selectedSemesters })
            });

            const data = await response.json();

            if (data.success) {
                toast.success(`${selectedCount} semester(s) activated successfully!`);
                onUpdate();
                setShowActivateDialog(false);
            } else {
                toast.error(data.error || 'Failed to activate semesters');
            }
        } catch (error) {
            console.error('Error activating semesters:', error);
            toast.error('Failed to activate semesters');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBulkDeactivate = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/admin/semesters/bulk-deactivate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ semesterIds: selectedSemesters })
            });

            const data = await response.json();

            if (data.success) {
                toast.success(`${selectedCount} semester(s) deactivated successfully!`);
                onUpdate();
                setShowDeactivateDialog(false);
            } else {
                toast.error(data.error || 'Failed to deactivate semesters');
            }
        } catch (error) {
            console.error('Error deactivating semesters:', error);
            toast.error('Failed to deactivate semesters');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/admin/semesters/bulk-delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ semesterIds: selectedSemesters })
            });

            const data = await response.json();

            if (data.success) {
                toast.success(`${selectedCount} semester(s) deleted successfully!`);
                onUpdate();
                setShowDeleteDialog(false);
            } else {
                toast.error(data.error || 'Failed to delete semesters');
            }
        } catch (error) {
            console.error('Error deleting semesters:', error);
            toast.error('Failed to delete semesters');
        } finally {
            setIsLoading(false);
        }
    };

    if (semesters.length === 0) return null;

    return (
        <>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 mb-6 border-2 border-blue-200 dark:border-blue-700/50 shadow-lg">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    {/* Selection Info */}
                    <div className="flex items-center gap-4">
                        <Button
                            onClick={onSelectAll}
                            variant="outline"
                            size="sm"
                            className="h-10 px-4 gap-2 border-2 font-semibold hover:bg-white dark:hover:bg-slate-800"
                        >
                            {allSelected ? (
                                <>
                                    <CheckSquare className="h-4 w-4 text-blue-600" />
                                    Deselect All
                                </>
                            ) : (
                                <>
                                    <Square className="h-4 w-4" />
                                    Select All
                                </>
                            )}
                        </Button>

                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {selectedCount > 0 ? (
                                    <>
                                        <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">{selectedCount}</span>
                                        {' '}/{' '}{semesters.length} selected
                                    </>
                                ) : (
                                    'No semesters selected'
                                )}
                            </span>
                        </div>
                    </div>

                    {/* Bulk Action Buttons */}
                    {selectedCount > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                onClick={() => setShowActivateDialog(true)}
                                variant="default"
                                size="sm"
                                className="h-10 px-4 gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md"
                            >
                                <Power className="h-4 w-4" />
                                Activate Selected
                            </Button>

                            <Button
                                onClick={() => setShowDeactivateDialog(true)}
                                variant="outline"
                                size="sm"
                                className="h-10 px-4 gap-2 border-2 border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 font-semibold"
                            >
                                <PowerOff className="h-4 w-4" />
                                Deactivate Selected
                            </Button>

                            <Button
                                onClick={() => setShowDeleteDialog(true)}
                                variant="destructive"
                                size="sm"
                                className="h-10 px-4 gap-2 font-semibold shadow-md"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete Selected
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Activate Confirmation Dialog */}
            <Dialog open={showActivateDialog} onOpenChange={setShowActivateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Power className="h-5 w-5 text-green-600" />
                            Activate Selected Semesters
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to activate <span className="font-bold text-green-600">{selectedCount}</span> selected semester(s)?
                            This will make them accessible to students.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowActivateDialog(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleBulkActivate}
                            disabled={isLoading}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Activating...
                                </>
                            ) : (
                                'Activate'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Deactivate Confirmation Dialog */}
            <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <PowerOff className="h-5 w-5 text-orange-600" />
                            Deactivate Selected Semesters
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to deactivate <span className="font-bold text-orange-600">{selectedCount}</span> selected semester(s)?
                            Students will not be able to access them.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowDeactivateDialog(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleBulkDeactivate}
                            disabled={isLoading}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deactivating...
                                </>
                            ) : (
                                'Deactivate'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Delete Selected Semesters
                        </DialogTitle>
                        <DialogDescription>
                            <div className="space-y-2">
                                <p>
                                    Are you sure you want to <span className="font-bold text-red-600">permanently delete</span>{' '}
                                    {selectedCount} selected semester(s)?
                                </p>
                                <p className="text-red-600 font-semibold">
                                     This will also delete all subjects and materials in these semesters!
                                </p>
                                <p className="text-sm">This action cannot be undone.</p>
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteDialog(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleBulkDelete}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete Permanently'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default SemesterBulkActions;

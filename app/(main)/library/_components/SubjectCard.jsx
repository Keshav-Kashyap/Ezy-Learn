
"use client"
import React, { useState, useEffect, useContext } from 'react';
import { Download, ArrowLeft, Loader2, Upload, Trash2, MoreVertical, Edit, Eye, Star, X, Pin, PinOff, Lock, BookOpen } from 'lucide-react';
import { useParams } from "next/navigation";
import Link from 'next/link';
import SubjectActions from '@/app/admin/library/_components/SubjectActions';
import FormCreateMaterial from '@/app/admin/library/_components/formCreateMaterail';
import { UserDetailContext } from '@/context/UserDetailContext';
import CustomPdfViewer from '@/components/CustomPdfViewer';
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { getFileType } from '@/lib/utils';

const SubjectCard = ({ subject, onDownload, isAdmin, onUpdate }) => {
    const { userDetail } = useContext(UserDetailContext) || {};
    const isOutOfCredits = !isAdmin && (userDetail?.credits ?? 0) <= 0;
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [materialToDelete, setMaterialToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [materialToEdit, setMaterialToEdit] = useState(null);
    const [deletingMaterialId, setDeletingMaterialId] = useState(null);
    const [localMaterials, setLocalMaterials] = useState(subject.materials || []);
    const [viewingPdf, setViewingPdf] = useState(null);

    // Helper function to check if material is popular based on tags
    const isPopularMaterial = (material) => {
        try {
            const tags = material.tags ? JSON.parse(material.tags) : [];
            return tags.includes('popular');
        } catch (e) {
            return material.isPopular || false; // Fallback to boolean
        }
    };

    // Update local materials when subject changes
    useEffect(() => {
        setLocalMaterials(subject.materials || []);
    }, [subject.materials]);

    const [fileSizes, setFileSizes] = useState({});

    // Dynamically fetch real file sizes for materials from URL
    useEffect(() => {
        if (!subject.materials) return;
        subject.materials.forEach((m) => {
            if (m.fileUrl && !m.size) {
                fetch(`/api/download/file-info?url=${encodeURIComponent(m.fileUrl)}`)
                    .then((r) => r.json())
                    .then((data) => {
                        if (data?.formattedSize) {
                            setFileSizes((prev) => ({ ...prev, [m.id]: data.formattedSize }));
                        }
                    })
                    .catch(() => {});
            }
        });
    }, [subject.materials]);



    const handleDownloadClick = (material) => {
        
    onDownload(material);
      
    };

    const handleDeleteMaterial = async (material) => {
        setMaterialToDelete(material);
        setDeleteDialogOpen(true);
    };

    const handleEditMaterial = (material) => {
        setMaterialToEdit(material);
        setEditDialogOpen(true);
    };

    const handleTogglePopular = async (material) => {
        const currentIsPopular = isPopularMaterial(material);
        const newPopularStatus = !currentIsPopular;
        const toastId = toast.loading(`${newPopularStatus ? 'Marking' : 'Unmarking'} as popular...`);

        try {
            const response = await fetch('/api/admin/materials/toggle-popular', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    materialId: material.id,
                    isPopular: newPopularStatus
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success(`Material ${newPopularStatus ? 'marked' : 'unmarked'} as popular!`, { id: toastId });
                onUpdate(); // Refresh the data
            } else {
                toast.error(data.error || 'Failed to update', { id: toastId });
            }
        } catch (error) {
            console.error('Error toggling popular:', error);
            toast.error('Failed to update popular status', { id: toastId });
        }
    };

    const handleTogglePin = async (material) => {
        const currentIsPinned = material.isPinned || false;
        const newPinnedStatus = !currentIsPinned;
        const toastId = toast.loading(`${newPinnedStatus ? 'Pinning' : 'Unpinning'} material...`);

        try {
            const response = await fetch('/api/admin/materials/toggle-pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mappingId: material.mappingId,
                    subjectId: subject.id,
                    isPinned: newPinnedStatus
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success(`Material ${newPinnedStatus ? 'pinned' : 'unpinned'} successfully!`, { id: toastId });
                onUpdate(); // Refresh the data
            } else {
                toast.error(data.error || 'Failed to update', { id: toastId });
            }
        } catch (error) {
            console.error('Error toggling pin:', error);
            toast.error('Failed to update pin status', { id: toastId });
        }
    };

    const confirmDelete = async () => {
        if (!materialToDelete) return;

        // Optimistic UI update - remove from local state immediately
        setDeletingMaterialId(materialToDelete.id);
        setLocalMaterials(prev => prev.filter(m => m.id !== materialToDelete.id));
        setDeleteDialogOpen(false);

        const toastId = toast.loading('Removing material...');

        try {
            setDeleting(true);
            const response = await fetch(`/api/admin/materials?id=${materialToDelete.id}&subjectId=${subject.id}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (data.success) {
                if (data.isShared && data.remainingSubjects > 0) {
                    toast.success('Material removed from this subject!', {
                        id: toastId,
                        description: `Still available in ${data.remainingSubjects} other subject${data.remainingSubjects > 1 ? 's' : ''}`
                    });
                } else {
                    toast.success('Material removed from this subject!', { id: toastId });
                }
                setMaterialToDelete(null);
                onUpdate(); // Refresh the data from server
            } else {
                // Revert on error
                setLocalMaterials(subject.materials || []);
                toast.error(data.error || 'Failed to delete material', { id: toastId });
            }
        } catch (error) {
            console.error('Error deleting material:', error);
            // Revert on error
            setLocalMaterials(subject.materials || []);
            toast.error('Failed to delete material', { id: toastId });
        } finally {
            setDeleting(false);
            setDeletingMaterialId(null);
        }
    };

    return (
        <div className="bg-white dark:bg-[rgb(24,24,24)] rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
            <div className="mb-4 flex items-start justify-between gap-2">
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {subject.name}
                    </h3>
                    {subject.code && (
                        <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                            {subject.code}
                        </span>
                    )}
                </div>

                {/* Admin Actions */}
                {isAdmin && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Edit/Delete/Upload Actions */}
                        <SubjectActions
                            subject={subject}
                            onUpdate={onUpdate}
                            onUploadClick={() => setIsUploadOpen(true)}
                        />

                        {/* Upload Material Dialog */}
                        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                            <FormCreateMaterial
                                onClose={() => setIsUploadOpen(false)}
                                onSuccess={() => {
                                    setIsUploadOpen(false);
                                    onUpdate();
                                }}
                                prefilledSubjectCode={subject.code}
                            />
                        </Dialog>
                    </div>
                )}
            </div>

            {/* Materials List */}
            <div className="space-y-3">
                {localMaterials && localMaterials.length > 0 ? (
                    // Sort materials: pinned first, then by created date
                    [...localMaterials]
                        .sort((a, b) => {
                            // First sort by pinned status
                            if (a.isPinned && !b.isPinned) return -1;
                            if (!a.isPinned && b.isPinned) return 1;
                            // Then by pinned date if both are pinned
                            if (a.isPinned && b.isPinned) {
                                return new Date(b.pinnedAt || 0) - new Date(a.pinnedAt || 0);
                            }
                            // For non-pinned, maintain original order
                            return 0;
                        })
                        .map((material) => (
                            <div
                                key={material.id}
                                className={`relative flex flex-col gap-3 p-3 rounded-lg transition-all duration-300 ${material.isPinned
                                        ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700'
                                        : 'bg-gray-50 dark:bg-gray-700/50'
                                    } ${deletingMaterialId === material.id ? 'opacity-50 animate-pulse' : ''}`}
                            >
                                {/* Pinned Badge - Top Left */}
                                {material.isPinned && (
                                    <div className="absolute -top-2 -left-2 bg-blue-600 rounded-full p-1.5 shadow-md z-10">
                                        <Pin className="h-3 w-3 text-white fill-white" />
                                    </div>
                                )}

                                {/* Popular Star Badge - Top Right */}
                                {isPopularMaterial(material) && (
                                    <div className="absolute -top-2 -right-2 bg-yellow-500 rounded-full p-1.5 shadow-md z-10">
                                        <Star className="h-3 w-3 text-white fill-white" />
                                    </div>
                                )}

                                {/* Title Section - Full Width */}
                                <div className="w-full">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-gray-900 dark:text-white truncate flex-1">
                                            {material.title}
                                        </p>
                                        {isPopularMaterial(material) && (
                                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                                        )}
                                        {material.likes >= 10 && (
                                            <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                                                {material.likes} ❤️
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        {(material.type || 'PDF').toUpperCase()} {(fileSizes[material.id] || (material.size && material.size !== '2.5 MB' ? material.size : '')) ? `• ${fileSizes[material.id] || material.size}` : ''}
                                    </p>
                                </div>

                                {/* Action Buttons - Bottom Row */}
                                <div className="flex items-center gap-2 w-full">
                                    <button
                                        onClick={() => setViewingPdf(material)}
                                        disabled={deletingMaterialId === material.id}
                                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-lg font-medium transition-all shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed flex-1"
                                    >
                                        <BookOpen className="h-4 w-4" />
                                        <span>Learn</span>
                                    </button>
                                    <button
                                        onClick={() => handleDownloadClick(material)}
                                        disabled={deletingMaterialId === material.id}
                                        className={`flex items-center justify-center gap-1.5 px-3 py-2 text-white rounded-lg font-medium transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex-1 ${
                                            isOutOfCredits
                                                ? 'bg-amber-600 hover:bg-amber-700'
                                                : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                        title={isOutOfCredits ? 'Needs credits to download' : 'Download material'}
                                    >
                                        {isOutOfCredits ? <Lock className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                                        <span>Download</span>
                                    </button>
                                    {isAdmin && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button
                                                    disabled={deletingMaterialId === material.id}
                                                    className="flex items-center justify-center w-9 h-9 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0">
                                                    <MoreVertical className="h-5 w-5" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                                <DropdownMenuItem
                                                    onClick={() => handleTogglePin(material)}
                                                    className="cursor-pointer"
                                                >
                                                    {material.isPinned ? (
                                                        <>
                                                            <PinOff className="h-4 w-4 mr-2" />
                                                            Unpin Material
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Pin className="h-4 w-4 mr-2" />
                                                            Pin to Top
                                                        </>
                                                    )}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleTogglePopular(material)}
                                                    className="cursor-pointer"
                                                >
                                                    <Star className={`h-4 w-4 mr-2 ${isPopularMaterial(material) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                                                    {isPopularMaterial(material) ? 'Remove from Popular' : 'Mark as Popular'}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleEditMaterial(material)}
                                                    className="cursor-pointer"
                                                >
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Edit Material
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDeleteMaterial(material)}
                                                    className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete Material
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
                            </div>
                        ))
                ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                        No materials available
                    </p>
                )}
            </div>

            {/* Edit Material Dialog */}
            {materialToEdit && (
                <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                    <FormCreateMaterial
                        onClose={() => {
                            setEditDialogOpen(false);
                            setMaterialToEdit(null);
                        }}
                        onSuccess={() => {
                            setEditDialogOpen(false);
                            setMaterialToEdit(null);

                            // Show loading toast
                            const toastId = toast.loading('Refreshing materials...');

                            // Refresh data
                            onUpdate();

                            // Dismiss loading after a short delay
                            setTimeout(() => {
                                toast.dismiss(toastId);
                            }, 500);
                        }}
                        editMode={true}
                        materialData={materialToEdit}
                    />
                </Dialog>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="bg-white dark:bg-gray-800">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                            Delete Material
                        </DialogTitle>
                        <DialogDescription className="text-gray-600 dark:text-gray-400">
                            Are you sure you want to delete this material? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    {materialToDelete && (
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                            <p className="font-medium text-gray-900 dark:text-white">
                                {materialToDelete.title}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {(materialToDelete.type || 'PDF').toUpperCase()} {materialToDelete.size && materialToDelete.size !== '2.5 MB' ? `• ${materialToDelete.size}` : ''}
                            </p>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={deleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmDelete}
                            disabled={deleting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {deleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Material
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Custom PDF Viewer Modal */}
            {viewingPdf && (
                <CustomPdfViewer
                    material={viewingPdf}
                    onClose={() => setViewingPdf(null)}
                />
            )}
        </div>
    );
};


export default SubjectCard;
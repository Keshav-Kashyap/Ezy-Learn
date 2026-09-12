"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Heart, TrendingUp, Eye, MoreVertical, Star, Search, Trash2, Edit, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import GenericCard from '@/app/(main)/_components/shared/GenericCard';
import { motion } from "motion/react";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import FormCreateMaterial from '@/app/admin/library/_components/formCreateMaterail';

export default function AdminPopularNotesPage() {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [materialToEdit, setMaterialToEdit] = useState(null);
    const [updatingId, setUpdatingId] = useState(null); // Track which card is updating

    useEffect(() => {
        fetchPopularNotes();
    }, []);

    const fetchPopularNotes = async () => {
        try {
            setLoading(true);

            // Fetch popular notes from API
            const response = await fetch("/api/material/popular");
            const notesData = await response.json();
            console.log("Popular notes data:", notesData);

            // API returns object with notes array
            if (notesData.success && Array.isArray(notesData.notes)) {
                // Sort by likes (most popular first)
                const sortedNotes = notesData.notes.sort((a, b) => (b.likes || 0) - (a.likes || 0));
                setNotes(sortedNotes);
            } else {
                console.error("Expected notes array but got:", notesData);
                setNotes([]);
            }
        } catch (error) {
            console.error("Error fetching popular notes:", error);
            setNotes([]);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFromPopular = async (note) => {
        const toastId = toast.loading('Removing from popular...');
        setUpdatingId(note.id); // Show loading on this card

        try {
            const response = await fetch('/api/admin/materials/toggle-popular', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    materialId: note.id,
                    isPopular: false
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Removed from popular notes!', { id: toastId });

                // Remove from local state immediately
                setNotes(prevNotes => prevNotes.filter(n => n.id !== note.id));
            } else {
                toast.error(data.error || 'Failed to remove', { id: toastId });
            }
        } catch (error) {
            console.error('Error removing from popular:', error);
            toast.error('Failed to remove from popular', { id: toastId });
        } finally {
            setUpdatingId(null);
        }
    }; const handleEdit = (note) => {
        setMaterialToEdit(note);
        setEditDialogOpen(true);
    };

    const handleDownload = (note) => {
        if (note.fileUrl) {
            window.open(note.fileUrl, '_blank');
        }
    };

    const filteredNotes = notes.filter(note =>
        note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.type?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center dark:bg-[rgb(38,38,36)] justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading popular notes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container dark:bg-[rgb(38,38,36)] mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <TrendingUp className="h-8 w-8 text-blue-600" />
                        Popular Notes
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">Most liked and downloaded study materials with popular tag</p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="flex justify-between items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search popular notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''} found
                </Badge>
            </div>

            {/* Popular Notes Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredNotes.map((note, index) => {
                    const formattedDate = note.createdAt
                        ? new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : 'N/A';

                    return (
                        <motion.div
                            key={note.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.05 }}
                            className="relative"
                        >
                            {/* Loading overlay when updating this specific card */}
                            {updatingId === note.id && (
                                <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 z-30 flex items-center justify-center rounded-xl">
                                    <div className="text-center">
                                        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Updating...</p>
                                    </div>
                                </div>
                            )}

                            {/* Three-dot menu - Outside card */}
                            <div className="absolute top-2 right-2 z-20">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 shadow-sm"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem
                                            onClick={() => handleEdit(note)}
                                            className="cursor-pointer"
                                        >
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit Material
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => handleRemoveFromPopular(note)}
                                            className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                                        >
                                            <Star className="h-4 w-4 mr-2" />
                                            Remove from Popular
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <GenericCard
                                item={note}
                                imageUrl={note.imageUrl}
                                title={note.title || 'Study Material'}
                                subtitle={note.description || 'Comprehensive study material'}
                                showStats={true}
                                badges={[
                                    index < 3 ? {
                                        label: `#${index + 1}`,
                                        position: 'top-right',
                                        bgColor: index === 0 ? 'bg-yellow-500 text-white' :
                                            index === 1 ? 'bg-gray-400 text-white' :
                                                'bg-orange-600 text-white'
                                    } : null,
                                    { label: note.type || 'PDF', position: 'top-left', bgColor: 'bg-white/30 backdrop-blur-sm text-white' }
                                ].filter(Boolean)}
                                stats={[
                                    {
                                        icon: <Heart className="w-4 h-4 text-red-500" />,
                                        label: 'Likes',
                                        value: note.likes || 0,
                                        bgColor: 'bg-red-100 dark:bg-red-900/30'
                                    },
                                    {
                                        icon: <Download className="w-4 h-4 text-green-600" />,
                                        label: 'Downloads',
                                        value: note.downloadCount || 0,
                                        bgColor: 'bg-green-100 dark:bg-green-900/30'
                                    }
                                ]}
                                actions={[
                                    {
                                        label: 'Download',
                                        onClick: () => handleDownload(note),
                                        fullWidth: true,
                                        icon: <Download className="w-4 h-4" />
                                    }
                                ]}
                            />
                        </motion.div>
                    );
                })}
            </div>

            {filteredNotes.length === 0 && (
                <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No popular notes found</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                        {searchQuery ? "Try adjusting your search query" : "Add 'popular' tag to materials to show them here"}
                    </p>
                </div>
            )}

            {/* Summary Stats */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Popular Notes Summary
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">{filteredNotes.length}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Popular Notes</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-red-500">
                                {filteredNotes.reduce((sum, note) => sum + (note.likes || 0), 0)}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Likes</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">
                                {filteredNotes.reduce((sum, note) => sum + (note.downloadCount || 0), 0)}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Downloads</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-purple-600">
                                {Math.round(filteredNotes.reduce((sum, note) => sum + (note.likes || 0), 0) / (filteredNotes.length || 1))}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Likes</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Edit Material Dialog */}
            {materialToEdit && (
                <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                    <FormCreateMaterial
                        onClose={() => {
                            setEditDialogOpen(false);
                            setMaterialToEdit(null);
                            setUpdatingId(null);
                        }}
                        onSuccess={async (updatedData) => {
                            setEditDialogOpen(false);
                            const materialId = materialToEdit.id;
                            setMaterialToEdit(null);
                            setUpdatingId(materialId); // Show loading on this card

                            // Show loading toast
                            const toastId = toast.loading('Updating material...');

                            try {
                                // Fetch fresh data for this specific material
                                const response = await fetch('/api/material/popular');
                                const result = await response.json();

                                if (result.success) {
                                    // Update only the changed material in state
                                    setNotes(prevNotes => {
                                        return prevNotes.map(note => {
                                            const updatedNote = result.notes.find(n => n.id === note.id);
                                            return updatedNote || note;
                                        });
                                    });
                                    toast.success('Material updated successfully!', { id: toastId });
                                } else {
                                    // Fallback: full refresh
                                    await fetchPopularNotes();
                                    toast.success('Material updated!', { id: toastId });
                                }
                            } catch (error) {
                                console.error('Error refreshing:', error);
                                // Fallback: full refresh
                                await fetchPopularNotes();
                                toast.success('Material updated!', { id: toastId });
                            } finally {
                                setUpdatingId(null);
                            }
                        }}
                        editMode={true}
                        materialData={materialToEdit}
                    />
                </Dialog>
            )}
        </div>
    );
}
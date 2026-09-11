"use client"

import React, { useEffect, useState, useContext, useRef } from 'react';
import { Button } from "@/components/ui/button";
import GenericCard from '@/app/(main)/_components/shared/GenericCard';
import { toast } from 'sonner';
import { usePopularNotes } from '@/hooks/useCourses';
import GenericCardSkeleton from '@/app/(main)/_components/skeletons/GenericCardSkeleton';
import { UserDetailContext } from '@/context/UserDetailContext';
import { consumeCreditAndDownload } from '@/lib/downloadHelper';

import {
    Download,
    Share2,
    FileText,
    Calendar,
    Heart,
    Lock,
    Loader2
} from "lucide-react";
import HeroHeader from '@/app/(main)/dashboard/_components/HeroHeader';

const AllNotesGrid = ({ showHeader = true, searchQuery = '' }) => {
    const { userDetail, setUserDetail } = useContext(UserDetailContext) || {};
    const isAdmin = userDetail?.role === 'admin';
    const isOutOfCredits = !isAdmin && (userDetail?.credits ?? 0) <= 0;

    // Fetch ALL notes from database
    const { data, isLoading } = usePopularNotes(100, true);
    const allNotes = data?.notes || [];
    const filteredNotes = allNotes.filter(note =>
        (note.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (note.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (note.type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (note.category || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    const [likedNotes, setLikedNotes] = useState(new Set());

    // Lazy Loading / Infinite Scroll State
    const [visibleCount, setVisibleCount] = useState(6);
    const observerRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && visibleCount < allNotes.length) {
                    setVisibleCount((prev) => Math.min(prev + 6, allNotes.length));
                }
            },
            { threshold: 0.1 }
        );

        if (observerRef.current) {
            observer.observe(observerRef.current);
        }

        return () => observer.disconnect();
    }, [visibleCount, allNotes.length]);

    // Load liked notes from localStorage
    useEffect(() => {
        try {
            const raw = localStorage.getItem('likedNotes');
            if (raw) {
                const arr = JSON.parse(raw);
                if (Array.isArray(arr)) setLikedNotes(new Set(arr));
            }
        } catch (e) {
            console.warn('Failed to load liked notes from localStorage', e);
        }
    }, []);

    const handleDownload = (note) => {
        consumeCreditAndDownload({
            fileUrl: note.fileUrl,
            fileName: note.title,
            fileType: note.type,
            materialId: note.id,
            userDetail,
            setUserDetail,
        });
    };

    const handleShare = (note) => {
        if (navigator.share) {
            navigator.share({
                title: note.title,
                text: note.description,
                url: note.fileUrl
            });
            toast.success("Shared successfully!");
        } else {
            alert(`Share: ${note.title}`);
        }
    };

    const handleToggleLike = async (noteId) => {
        const isLiked = likedNotes.has(noteId);
        const newLiked = new Set(likedNotes);

        if (isLiked) {
            newLiked.delete(noteId);
        } else {
            newLiked.add(noteId);
        }

        setLikedNotes(newLiked);

        try {
            localStorage.setItem('likedNotes', JSON.stringify(Array.from(newLiked)));
        } catch (e) {
            console.warn('Failed to save liked notes to localStorage', e);
        }

        try {
            await fetch("/api/likeNote", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: noteId, liked: !isLiked }),
            });
        } catch (err) {
            console.error("Error toggling like:", err);
            if (isLiked) {
                newLiked.add(noteId);
            } else {
                newLiked.delete(noteId);
            }
            setLikedNotes(newLiked);
        }
    };

    return (
        <>
            {showHeader && (
                <HeroHeader
                    heading="All Study Notes"
                    subHeading="Browse our complete collection of study materials across all courses and subjects"
                    icon={FileText}
                />
            )}

            {isLoading ? (
                <div className="grid gap-6 grid-cols-1 mb-10 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <GenericCardSkeleton key={i} showImageHeader={false} />
                    ))}
                </div>
            ) : (
                <>
                    <div className="grid gap-6 grid-cols-1 mb-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredNotes.length === 0 ? (
                            <div className="col-span-full text-center py-12">
                                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                                <p className="text-gray-500 dark:text-gray-400">No notes found</p>
                            </div>
                        ) : (
                            filteredNotes.slice(0, visibleCount).map((note) => {
                                const formattedDate = note.createdAt
                                    ? new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                    : 'N/A';
                                const isLiked = likedNotes.has(note.id);
                                const rawSubject = note.subjects?.[0]?.name || note.subjectName || note.subject || note.category;
                                const hasSubject = Boolean(rawSubject && String(rawSubject).trim());
                                const cardTitle = hasSubject ? rawSubject : note.title;
                                const cardSubtitle = hasSubject ? note.title : null;

                                return (
                                    <GenericCard
                                        key={note.id}
                                        item={note}
                                        imageUrl={note.imageUrl}
                                        title={cardTitle}
                                        subtitle={cardSubtitle}
                                        showStats={true}
                                        badges={[
                                            { label: note.type || 'PDF', position: 'top-left', bgColor: 'bg-blue-600 text-white font-bold' }
                                        ]}
                                        stats={[
                                            {
                                                icon: <Download className="w-4 h-4 text-green-600 dark:text-green-400" />,
                                                label: '',
                                                value: note.downloadCount || 0,
                                                bgColor: 'bg-green-100 dark:bg-green-900/30'
                                            },
                                            {
                                                icon: <Calendar className="w-4 h-4 text-slate-600 dark:text-slate-400" />,
                                                label: '',
                                                value: formattedDate,
                                                bgColor: 'bg-slate-100 dark:bg-slate-800/50'
                                            }
                                        ]}
                                        viewLabel="View"
                                        actions={[
                                            {
                                                label: 'Download',
                                                onClick: () => handleDownload(note),
                                                fullWidth: true,
                                                icon: isOutOfCredits ? <Lock className="w-4 h-4" /> : <Download className="w-4 h-4" />
                                            },
                                            {
                                                label: '',
                                                onClick: () => handleShare(note),
                                                variant: 'outline',
                                                icon: <Share2 className="w-4 h-4" />
                                            }
                                        ]}
                                    />
                                );
                            })
                        )}
                    </div>

                    {/* Infinite Scroll Sentinel / Lazy Load Indicator */}
                    {visibleCount < allNotes.length && (
                        <div ref={observerRef} className="py-8 flex flex-col items-center justify-center space-y-2">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                Loading more notes as you scroll...
                            </span>
                        </div>
                    )}
                </>
            )}
        </>
    );
};

export default AllNotesGrid;

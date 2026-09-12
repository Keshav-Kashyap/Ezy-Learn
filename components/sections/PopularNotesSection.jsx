"use client";

import React, { useState, useContext } from 'react';
import { motion } from "motion/react";
import Link from "next/link";
import GenericCard from '@/app/(main)/_components/shared/GenericCard';
import { Download, FileText, Calendar, Heart, Share2, ArrowRight, BookOpen, Lock } from 'lucide-react';
import CourseSkeleton from '@/app/_components/landing/skeletons/CourseSkeleton';
import { UserDetailContext } from '@/context/UserDetailContext';
import { consumeCreditAndDownload } from '@/lib/downloadHelper';

const PopularNotesSection = ({ notes, loading, isSignedIn }) => {
    const { userDetail, setUserDetail } = useContext(UserDetailContext) || {};
    const isAdmin = userDetail?.role === 'admin';
    const isOutOfCredits = isSignedIn && !isAdmin && (userDetail?.credits ?? 0) <= 0;

    const handleDownload = async (note) => {
        if (!isSignedIn) {
            window.location.href = '/sign-in';
            return;
        }

        if (!note?.fileUrl) return;

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
        } else {
            navigator.clipboard.writeText(note.fileUrl);
            alert('Link copied to clipboard!');
        }
    };

    return (
        <section className="py-20 bg-white dark:bg-[rgb(38,38,36)]">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12">
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-center gap-3">
                        <BookOpen className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                        Popular Study Materials
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-400">
                        Most downloaded notes by students
                    </p>
                </motion.div>

                {loading ? (
                    <CourseSkeleton count={3} wrapperClassName="grid md:grid-cols-3 gap-8" />
                ) : notes && notes.length > 0 ? (
                    <div className="grid md:grid-cols-3 gap-8 mb-8">
                        {notes.map((note, i) => {
                            const formattedDate = note.createdAt
                                ? new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                : 'N/A';

                            return (
                                <motion.div
                                    key={note.id || i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}>
                                    <GenericCard
                                        item={note}
                                        imageUrl={note.imageUrl}
                                        title={note.title || 'Study Material'}
                                        subtitle={note.description || 'Comprehensive study material for your exam preparation'}
                                        showStats={true}
                                        badges={[
                                            { label: 'Popular', position: 'top-right', bgColor: 'bg-yellow-400 text-yellow-900' },
                                            { label: note.type || 'PDF', position: 'top-left', bgColor: 'bg-white/30 backdrop-blur-sm text-white' }
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
                                        actions={[
                                            {
                                                label: !isSignedIn ? 'Login to Download' : 'Download',
                                                onClick: () => handleDownload(note),
                                                fullWidth: true,
                                                icon: isOutOfCredits ? <Lock className="w-4 h-4" /> : <Download className="w-4 h-4" />
                                            },
                                            {
                                                label: '',
                                                onClick: () => handleShare(note),
                                                variant: 'outline',
                                                icon: <Share2 className="w-4 h-4" />
                                            },
                                            {
                                                label: note.likes || 0,
                                                onClick: () => { },
                                                variant: 'outline',
                                                icon: <Heart className="w-4 h-4" />
                                            }
                                        ]}
                                    />
                                </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="col-span-full text-center py-12">
                        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-500 dark:text-gray-400">No popular notes found</p>
                    </div>
                )}

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center">
                    <Link href="/popular">
                        <button className="px-8 py-4 mt-5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 inline-flex items-center gap-2">
                            View All Notes
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
};

export default PopularNotesSection;

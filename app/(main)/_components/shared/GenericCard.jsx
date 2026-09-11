import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, BookOpen, Heart } from 'lucide-react';
import dynamic from 'next/dynamic';
import axios from 'axios';
import { toast } from 'sonner';

const CustomPdfViewer = dynamic(() => import('@/components/CustomPdfViewer'), {
    ssr: false,
});

/**
 * Reusable Card Component
 * @param {Object} item - Card data (note, course, etc.)
 * @param {string} imageUrl - Image source
 * @param {string} title - Main title
 * @param {string} subtitle - Subtitle/description
 * @param {Array} badges - Array of badge objects: { label, variant, icon }
 * @param {Array} stats - Array of stat objects: { icon, label, value, bgColor }
 * @param {Array} actions - Array of action objects: { label, onClick, variant, icon }
 * @param {string} variant - 'default' or 'full-image'
 * @param {boolean} showImageHeader - If true, renders top image banner (for courses). If false, renders clean notes card layout.
 * @param {function} onLearn - Custom callback for Learn action (optional)
 */
const GenericCard = ({
    item,
    imageUrl,
    title,
    subtitle,
    description,
    badges = [],
    stats = [],
    actions = [],
    variant = 'default',
    showStats = true,
    showImageHeader = false,
    adminActions = null,
    onLearn = null,
    viewLabel = 'View'
}) => {
    const [viewingPdf, setViewingPdf] = useState(null);
    const [likeCount, setLikeCount] = useState(item?.likes || 0);
    const [isLiked, setIsLiked] = useState(false);

    useEffect(() => {
        if (item?.likes !== undefined) {
            setLikeCount(item.likes);
        }
    }, [item?.likes]);

    const handleLikeToggle = async (e) => {
        e?.stopPropagation();
        if (!item?.id) return;

        const nextLiked = !isLiked;
        setIsLiked(nextLiked);
        setLikeCount(prev => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));

        try {
            await axios.post('/api/likeNote', {
                id: item.id,
                liked: nextLiked
            });
            toast.success(nextLiked ? 'Liked note!' : 'Unliked note!');
        } catch (err) {
            console.error('Error updating note like:', err);
            setIsLiked(!nextLiked);
            setLikeCount(prev => (nextLiked ? Math.max(0, prev - 1) : prev + 1));
            toast.error('Failed to update like');
        }
    };

    // Non-image Header Mode: Modern clean note card layout matching user screenshot
    if (!showImageHeader) {
        const formattedDate = item?.createdAt
            ? new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
            : '08 Sep 2026';

        const downloadVal = item?.downloadCount ?? item?.downloads ?? (stats.find(s => s.icon)?.value) ?? 0;
        const downloadsText = Number(downloadVal || 0).toLocaleString();

        const isPopular = Boolean(
            item?.isPopular ||
            (Array.isArray(item?.tags) && item.tags.includes('popular')) ||
            badges.some(b => String(b.label || '').toLowerCase().includes('popular'))
        );

        const shareActions = actions.filter(a => !a.fullWidth);
        const primaryActions = actions.filter(a => a.fullWidth);

        const handleLearnClick = () => {
            if (onLearn) {
                onLearn(item);
            } else {
                setViewingPdf(item);
            }
        };

        return (
            <>
                <div className="group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 shadow-xs border bg-white dark:bg-[rgb(30,30,28)] border-gray-200/80 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-4 sm:p-5 flex flex-col justify-between h-full space-y-3">
                    {/* Top Section: Soft Pink Icon + Title & Description */}
                    <div>
                        <div className="flex items-start gap-3">
                            {/* Soft Light Pink Box Icon */}
                            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center flex-shrink-0 text-rose-500 dark:text-rose-300 border border-rose-100/60 dark:border-rose-900/30">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                </svg>
                            </div>

                            {/* Title & Subtitle */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug line-clamp-1">
                                        {title}
                                    </h3>
                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[10px] tracking-wide uppercase border border-slate-200/60 dark:border-slate-700/60 flex-shrink-0">
                                        PDF
                                    </span>
                                </div>
                                {(subtitle || description) && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2 font-normal">
                                        {subtitle || description}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Like Button (left of Popular tag) & Popular Badge */}
                        <div className="mt-3 flex items-center justify-end gap-2 flex-wrap">
                            <button
                                type="button"
                                onClick={handleLikeToggle}
                                title={isLiked ? "Unlike note" : "Like note"}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all border cursor-pointer hover:scale-105 active:scale-95 ${
                                    isLiked
                                        ? "bg-rose-500/10 border-rose-500/30 text-rose-500 dark:bg-rose-950/40 dark:border-rose-800/40 dark:text-rose-400"
                                        : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-rose-500 dark:hover:text-rose-400"
                                }`}
                            >
                                <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-rose-500 text-rose-500" : ""}`} />
                                <span>{likeCount}</span>
                            </button>

                            {isPopular && (
                                <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-amber-950 font-bold text-xs tracking-wide shadow-2xs">
                                    Popular
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Middle Divider & Metadata Info */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-normal mb-3">
                            <div>
                                Uploaded <span className="font-semibold text-slate-800 dark:text-slate-200">{formattedDate}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{downloadsText}</span> downloads
                            </div>
                        </div>

                        {/* Action Buttons Row */}
                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Learn Button (Opens PDF Viewer / AI Assistant) */}
                            <Button
                                onClick={handleLearnClick}
                                className="flex-1 h-9 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5"
                            >
                                {viewLabel === 'Learn' ? <BookOpen className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                <span>{viewLabel}</span>
                            </Button>

                            {/* Download Button */}
                            {primaryActions.map((action, idx) => (
                                <Button
                                    key={idx}
                                    onClick={action.onClick}
                                    className="flex-1 h-9 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition-all duration-200 flex items-center justify-center gap-1.5"
                                >
                                    {action.icon}
                                    <span>{action.label || 'Download'}</span>
                                </Button>
                            ))}

                            {/* Share / Like Buttons */}
                            {shareActions.map((action, idx) => (
                                <Button
                                    key={idx}
                                    onClick={action.onClick}
                                    variant="outline"
                                    className="h-11 px-3.5 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm border border-slate-200/60 dark:border-slate-700/60 transition-all shadow-2xs flex items-center justify-center gap-1"
                                >
                                    {action.icon}
                                    {action.label ? <span>{action.label}</span> : null}
                                </Button>
                            ))}

                            {adminActions && (
                                <div className="flex-shrink-0">
                                    {adminActions}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Custom PDF Viewer Modal with AI Chat Reader */}
                {viewingPdf && (
                    <CustomPdfViewer
                        material={viewingPdf}
                        onClose={() => setViewingPdf(null)}
                    />
                )}
            </>
        );
    }

    // Default Image Header Card Mode (for Courses)
    return (
        <div className="group overflow-hidden rounded-3xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 shadow-sm border bg-white dark:bg-[rgb(30,30,28)] border-gray-200/80 dark:border-gray-800 hover:border-indigo-500 dark:hover:border-indigo-500 flex flex-col justify-between h-full transform-gpu">
            <div>
                {/* Image Banner Header */}
                <div className={`relative ${variant === 'full-image' ? 'h-52' : 'h-48'} overflow-hidden -mb-px bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 flex items-center justify-center`}>
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 transform-gpu will-change-transform"
                            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-white p-6 text-center">
                            <span className="text-5xl">🎓</span>
                            <span className="text-lg font-bold tracking-tight opacity-90">{title}</span>
                        </div>
                    )}

                    {/* Gradient Overlay for visual polish */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

                    {/* Top Left Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                        {badges.filter(b => b.position === 'top-left').map((badge, idx) => (
                            <span
                                key={idx}
                                className={`${badge.bgColor || 'bg-slate-900/80 backdrop-blur-md text-white'} border-0 font-medium text-xs px-3 py-1 rounded-xl shadow-md uppercase tracking-wider`}
                            >
                                {badge.label}
                            </span>
                        ))}
                    </div>

                    {/* Top Right Badges */}
                    <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
                        {badges.filter(b => b.position === 'top-right' || (!b.position && badges.indexOf(b) === 0)).map((badge, idx) => (
                            <span
                                key={idx}
                                className={`${badge.bgColor || 'bg-indigo-600/90 backdrop-blur-md text-white'} border-0 font-medium text-xs px-3 py-1 rounded-xl shadow-md uppercase tracking-wider`}
                            >
                                {badge.icon && <span className="mr-1">{badge.icon}</span>}
                                {badge.label}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="p-6 pb-2">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">
                        {title}
                    </h3>
                    {subtitle && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed line-clamp-2 font-normal">
                            {subtitle}
                        </p>
                    )}
                    {description && !subtitle && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed line-clamp-2 font-normal">
                            {description}
                        </p>
                    )}
                </div>
            </div>

            {/* Bottom Stats & Action Button */}
            <div className="p-6 pt-0">
                {/* Stats Bar */}
                {showStats && stats.length > 0 && (
                    <div className="pt-2 mb-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center justify-between w-full gap-2">
                            {stats.map((stat, idx) => (
                                <div key={idx} className="flex items-center gap-1.5">
                                    <div className={`p-1.5 rounded-lg ${stat.bgColor || 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'}`}>
                                        {stat.icon}
                                    </div>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                                        {stat.value} {stat.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                {actions.length > 0 && (() => {
                    return (
                        <div className="flex gap-2 items-center">
                            {actions.map((action, idx) => {
                                const buttonContent = (
                                    <Button
                                        key={idx}
                                        onClick={action.onClick}
                                        variant={action.variant || 'default'}
                                        className={`
                                            w-full h-12 rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2
                                            ${action.variant === 'outline'
                                                ? 'border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                                : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white'}
                                        `}
                                    >
                                        {action.icon}
                                        <span>{action.label}</span>
                                    </Button>
                                );

                                return action.href ? (
                                    <Link key={idx} href={action.href} className="w-full">
                                        {buttonContent}
                                    </Link>
                                ) : (
                                    buttonContent
                                );
                            })}

                            {adminActions && (
                                <div className="flex-shrink-0">
                                    {adminActions}
                                </div>
                            )}
                        </div>
                    );
                })()}
            </div>
        </div>
    );
};

export default GenericCard;
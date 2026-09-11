import React from 'react';

const GenericCardSkeleton = ({ showImageHeader = false }) => {
    if (!showImageHeader) {
        return (
            <div className="border bg-white dark:bg-[rgb(30,30,28)] border-gray-200/80 dark:border-gray-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between h-full space-y-4 animate-pulse">
                <div>
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                        </div>
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                        <div className="w-12 h-6 rounded-lg bg-slate-200 dark:bg-slate-800" />
                        <div className="w-14 h-6 rounded-lg bg-slate-200 dark:bg-slate-800" />
                    </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                    <div className="flex justify-between">
                        <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                        <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                    </div>
                    <div className="flex gap-2">
                        <div className="flex-1 h-9 rounded-xl bg-slate-200 dark:bg-slate-800" />
                        <div className="flex-1 h-9 rounded-xl bg-slate-200 dark:bg-slate-800" />
                        <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-3xl border bg-white dark:bg-[rgb(30,30,28)] border-gray-200/80 dark:border-gray-800 animate-pulse">
            <div className="h-44 bg-slate-200 dark:bg-slate-800" />
            <div className="p-5 space-y-3">
                <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                <div className="pt-4 flex justify-between">
                    <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
                <div className="h-10 rounded-2xl bg-slate-200 dark:bg-slate-800 mt-2" />
            </div>
        </div>
    );
};

export default GenericCardSkeleton;

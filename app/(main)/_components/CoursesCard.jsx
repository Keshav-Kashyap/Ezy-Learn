"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useCourses } from '@/hooks/useCourses';
import {
    Users,
    FileText,
    Star,
    TrendingUp,
    Upload,
    Edit,
    Settings,
    MoreVertical,
    Trash2
} from "lucide-react";
import Link from "next/link";
import GenericCard from "./shared/GenericCard";
import GenericCardSkeleton from './skeletons/GenericCardSkeleton';
import CourseActions from "@/app/admin/library/_components/CourseActions";


const CoursesCard = ({ courses, viewMode, searchQuery = '', isAdmin = false, baseRoute = "/library", onUpdate, showPopularBadge = false }) => {
    const router = useRouter();

    // Use React Query hook only if courses prop is not provided
    const { data: fetchedCourses, isLoading, isError } = useCourses();

    // Use provided courses or fetched courses
    const effectiveCourses = courses ?? fetchedCourses ?? [];

    const filteredCourses = effectiveCourses.filter(course =>
        (course.title || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
        (course.category || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
        (course.description || '').toLowerCase().includes((searchQuery || '').toLowerCase())
    );
    return (
        <>
            {isLoading && courses === undefined ? (
                <div className="grid mb-15 gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <GenericCardSkeleton key={i} />
                    ))}
                </div>
            ) : filteredCourses.length > 0 ? (
                <div className={`grid mb-15 gap-6 ${viewMode === "grid"
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                    : 'grid-cols-1'
                    }`}>
                    {filteredCourses.map((course) => (
                        <GenericCard
                            key={course.id || course.title}
                            item={course}
                            imageUrl={course.image}
                            showImageHeader={true}
                            title={course.title}
                            subtitle={course.subtitle}
                            description={course.description}
                            badges={[
                                showPopularBadge
                                    ? { label: 'Popular', position: 'top-right', bgColor: 'bg-yellow-400 text-yellow-950 font-bold shadow-sm' }
                                    : { label: 'Course', position: 'top-right', bgColor: 'bg-indigo-600 text-white shadow-md font-bold' },
                                { label: course.category || 'Degree', position: 'top-left', bgColor: 'bg-slate-900/80 backdrop-blur-md text-white' }
                            ]}
                            stats={[
                                {
                                    icon: <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
                                    label: 'docs',
                                    value: course.documents,
                                    bgColor: 'bg-blue-100 dark:bg-blue-900/30'
                                },
                                {
                                    icon: <Users className="w-4 h-4 text-green-600 dark:text-green-400" />,
                                    label: '',
                                    value: course.students,
                                    bgColor: 'bg-green-100 dark:bg-green-900/30'
                                }
                            ]}
                            actions={
                                isAdmin ? [
                                    {
                                        label: 'Manage Course',
                                        href: `${baseRoute}/${course.code || course.category}`,
                                        fullWidth: true
                                    }
                                ] : [
                                    {
                                        label: 'Start Learning',
                                        href: `${baseRoute}/${course.category}`,
                                        fullWidth: true
                                    }
                                ]
                            }
                            adminActions={
                                isAdmin ? (
                                    <CourseActions
                                        course={{
                                            id: course.id,
                                            name: course.subtitle || course.title,
                                            code: course.code || course.category,
                                            description: course.description,
                                            duration: course.duration || 3
                                        }}
                                        onUpdate={onUpdate}
                                    />
                                ) : null
                            }
                        />
                    ))}
                </div >
            ) : (
                <div className="text-center py-20">
                    <div className="text-slate-500 text-lg">
                        {searchQuery ? 'No courses found matching your search.' : 'No courses available.'}
                    </div>
                </div>
            )}
        </>
    )
}

export default CoursesCard;







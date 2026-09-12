"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Grid, List, FileText, Upload } from "lucide-react";
import CreateCourseForm from "./_components/CreateNewCourse";
import StatsCards from "./_components/StatusCards";
import CoursesCard from "../../(main)/allCourses/_components/CoursesCard";
import { useAdminCourses, useInvalidateAdminData } from '@/hooks/useAdminData';
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import FormUploadSyllabus from "./_components/FormUploadSyllabus";

export default function AdminLibraryPage() {
    const { data: adminData, isLoading } = useAdminCourses();
    const { invalidateCourses } = useInvalidateAdminData();

    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState("grid");
    const [isSyllabusDialogOpen, setIsSyllabusDialogOpen] = useState(false);

    const courses = adminData || [];
    const semesters = [];
    const subjects = [];
    const materials = [];

    const fetchData = () => {
        invalidateCourses();
    };

    const getDefaultImage = (category) => {
        const images = {
            'MCA': "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400&h=300&fit=crop",
            'BCA': "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=300&fit=crop",
            'BTech': "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop",
            'General': "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop"
        };
        return images[category] || images['General'];
    };

    // Transform courses data to match CoursesCard format
    const transformedCourses = courses.map(course => ({
        id: course.id,
        title: course.title || course.name,
        subtitle: course.subtitle || course.description?.substring(0, 100),
        description: course.description || "Course management and material upload.",
        category: course.category,
        documents: materials.filter(m => m.subjectId && subjects.find(s => s.category === course.category)).length || 0,
        students: `${Math.floor(Math.random() * 500) + 100}+`,
        semesters: semesters.filter(s => s.category === course.category).length || 0,
        duration: course.category === 'mca' ? '2 Years' : course.category === 'bca' ? '3 Years' : '4 Years',
        image: course.image || getDefaultImage(course.category || 'General'),
        bgColor: 'bg-blue-500',
        isUserCourse: false
    }));

    // Function to get default images based on category


    if (isLoading) {
        return (
            <div className="flex items-center dark:bg-[rgb(38,38,36)] justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading library data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container dark:bg-[rgb(38,38,36)] mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Library Management System</h1>
                    <p className="text-sm sm:text-base text-gray-600 mt-2 ">Complete course, semester, subject & material management</p>
                </div>
                <div className="flex gap-3">
                    <Dialog open={isSyllabusDialogOpen} onOpenChange={setIsSyllabusDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-green-600 hover:bg-green-700 text-white gap-2">
                                <FileText className="h-4 w-4" />
                                Upload Syllabus
                            </Button>
                        </DialogTrigger>
                        <FormUploadSyllabus
                            onClose={() => setIsSyllabusDialogOpen(false)}
                            onSuccess={() => {
                                fetchData();
                                setIsSyllabusDialogOpen(false);
                            }}
                        />
                    </Dialog>
                    <CreateCourseForm onCourseCreated={fetchData} />
                </div>
            </div>

            <StatsCards
                courses={courses}
                semesters={semesters}
                subjects={subjects}
                materials={materials}
            />

            {/* Search and Filters - Admin */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500" />
                    <Input
                        placeholder="Search courses, categories, or materials..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 h-12 text-lg border shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        className="h-12 px-6 shadow-sm"
                    >
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                    </Button>

                    <div className="flex rounded-lg overflow-hidden shadow-sm border">
                        <Button
                            variant={viewMode === "grid" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("grid")}
                            className={`rounded-none h-12 px-4 ${viewMode === "grid"
                                ? "bg-blue-600 text-white"
                                : "text-slate-700 hover:text-slate-900"
                                }`}
                        >
                            <Grid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === "list" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("list")}
                            className={`rounded-none h-12 px-4 ${viewMode === "list"
                                ? "bg-blue-600 text-white"
                                : "text-slate-700 hover:text-slate-900"
                                }`}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Course Grid - Admin */}
            <div className="mt-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Course Management</h2>
                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {transformedCourses.length} course{transformedCourses.length !== 1 ? 's' : ''} found
                    </div>
                </div>
                <CoursesCard
                    courses={transformedCourses}
                    viewMode={viewMode}
                    searchQuery={searchQuery}
                    isAdmin={true}
                    baseRoute="/admin/library"
                    onUpdate={fetchData}
                />
            </div>
        </div>
    );
}
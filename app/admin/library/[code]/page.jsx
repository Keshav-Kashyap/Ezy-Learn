"use client"
import React, { useState, useEffect, useContext } from 'react';
import { Calendar, Loader2, FileText, Upload, Download } from 'lucide-react';
import { useParams } from "next/navigation";
import SemesterCard from '@/app/(main)/library/_components/SemesterCard';
import { useUser } from '@clerk/nextjs';
import { UserDetailContext } from '@/context/UserDetailContext';
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import SemesterBulkActions from '../_components/SemesterBulkActions';
import SyllabusUploadDialog from '../_components/SyllabusUploadDialog';

const SemesterOverview = () => {
    const { code } = useParams();
    const [courseData, setCourseData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSemesters, setSelectedSemesters] = useState([]);
    const [syllabi, setSyllabi] = useState([]);
    const [loadingSyllabi, setLoadingSyllabi] = useState(false);
    const { user } = useUser();
    const { userDetail } = useContext(UserDetailContext);
    const isAdmin = userDetail?.role === "admin";

    const handleUpdate = () => {
        // Refetch the data after update/delete
        setSelectedSemesters([]);
        fetchCourseData();
    };

    const handleSelectSemester = (semesterId) => {
        setSelectedSemesters(prev =>
            prev.includes(semesterId)
                ? prev.filter(id => id !== semesterId)
                : [...prev, semesterId]
        );
    };

    const handleSelectAll = () => {
        if (selectedSemesters.length === courseData?.semesters?.length) {
            setSelectedSemesters([]);
        } else {
            setSelectedSemesters(courseData?.semesters?.map(s => s.id) || []);
        }
    };

    const fetchCourseData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/courses/${code}`);
            const data = await response.json();


            if (data.success) {
                setCourseData(data.course);
                // Fetch syllabi after course data loads
                fetchSyllabi(data.course.category);
            } else {
                throw new Error(data.error || 'Failed to fetch course data');
            }
        } catch (err) {
            console.error('Error fetching course data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchSyllabi = async (category) => {
        try {
            setLoadingSyllabi(true);
            console.log("📚 Fetching syllabi for category:", category);
            const response = await fetch(`/api/admin/syllabus?category=${category}`);
            const data = await response.json();

            console.log(" Syllabi response:", data);

            if (data.success) {
                console.log(" Syllabi loaded:", data.syllabi?.length || 0);
                setSyllabi(data.syllabi || []);
            } else {
                console.error("❌ Failed to fetch syllabi:", data.error);
            }
        } catch (error) {
            console.error('Error fetching syllabi:', error);
        } finally {
            setLoadingSyllabi(false);
        }
    };

    useEffect(() => {
        if (code) {
            fetchCourseData();
        }
    }, [code]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[rgb(38,38,36)] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-lg text-gray-600 dark:text-gray-300">Loading course data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[rgb(38,38,36)] flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-6">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl"></span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Error Loading Course
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[rgb(38,38,36)] p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <div className="min-w-0 flex-1">
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white break-words">
                            {courseData.title}
                        </h1>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium mt-1">
                            {courseData.semesters?.length || 0} Semester Program
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[rgb(24,24,24)] rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg mb-8">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                                Course Overview
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                {courseData.description || "Access comprehensive study materials, notes, and resources for each semester."}
                            </p>
                        </div>
                    </div>

                    {/* Syllabus Section */}
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Course Syllabus
                                </h3>
                            </div>
                            {isAdmin && (
                                <SyllabusUploadDialog
                                    category={courseData.category}
                                    year={1}
                                    onUploadSuccess={() => fetchSyllabi(courseData.category)}
                                    trigger={
                                        <Button size="sm" className="gap-2">
                                            <PlusCircle className="h-4 w-4" />
                                            Add Syllabus
                                        </Button>
                                    }
                                />
                            )}
                        </div>

                        {loadingSyllabi ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                            </div>
                        ) : syllabi.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {syllabi.map((syllabus) => (
                                    <div
                                        key={syllabus.id}
                                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                {syllabus.title}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Year {syllabus.year}
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => window.open(syllabus.fileUrl, '_blank')}
                                            className="ml-2 flex-shrink-0"
                                        >
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No syllabus uploaded yet</p>
                                {isAdmin && (
                                    <p className="text-xs mt-1">Click "Add Syllabus" to upload</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Bulk Actions for Admin */}
                {isAdmin && courseData.semesters?.length > 0 && (
                    <SemesterBulkActions
                        semesters={courseData.semesters}
                        selectedSemesters={selectedSemesters}
                        onSelectAll={handleSelectAll}
                        onUpdate={handleUpdate}
                    />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courseData.semesters?.map((semester) => (
                        <SemesterCard
                            key={semester.id}
                            semester={semester}
                            code={code}
                            isAdmin={isAdmin}
                            onUpdate={handleUpdate}
                            isSelected={selectedSemesters.includes(semester.id)}
                            onSelect={() => handleSelectSemester(semester.id)}
                        />
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-white dark:bg-[rgb(24,24,24)] rounded-full border border-gray-200 dark:border-gray-700 shadow-lg">
                        <Calendar size={20} className="text-blue-600 dark:text-blue-400" />
                        <span className="text-gray-700 dark:text-gray-300 font-medium">
                            Academic Year 2024-25
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SemesterOverview;
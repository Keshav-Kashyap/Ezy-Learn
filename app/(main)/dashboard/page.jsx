"use client";

import React, { useState, useEffect, useContext, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    BookOpen,
    GraduationCap,
    Building2,
    FileText,
    Download,
    Share2,
    ArrowRight,
    PlayCircle,
    TrendingUp,
    Sparkles,
    SlidersHorizontal,
    Lock,
    Clock,
    Loader2,
    FolderBook,
    Layers,
    Search,
    CheckCircle2,
    FolderOpen,
    FileCheck,
    Filter,
    Check
} from "lucide-react";
import axios from "axios";
import GenericCard from "../_components/shared/GenericCard";
import GenericCardSkeleton from "../_components/skeletons/GenericCardSkeleton";
import { UserDetailContext } from "@/context/UserDetailContext";
import { useDashboardData, usePopularNotes, useSemesterDetail, useUserProfile } from "@/hooks/useCourses";
import { consumeCreditAndDownload } from "@/lib/downloadHelper";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function DashboardPage() {
    const queryClient = useQueryClient();
    const { userDetail, setUserDetail } = useContext(UserDetailContext) || {};
    const isAdmin = userDetail?.role === 'admin';
    const isOutOfCredits = !isAdmin && (userDetail?.credits ?? 0) <= 0;

    // Academic Profile Preferences State (Initial null to ensure profile loads first)
    const [academicProfile, setAcademicProfile] = useState({
        program: null,
        semester: null
    });

    // React Query: Fetch user profile first with memory caching
    const { data: profileData, isLoading: isLoadingProfile } = useUserProfile();
    const isProfileLoaded = !isLoadingProfile && Boolean(profileData?.success);

    useEffect(() => {
        if (profileData?.success && profileData?.profile) {
            const profile = profileData.profile;
            const semNumber = (profile.semester || "").replace(/[^0-9]/g, "") || "1";
            setAcademicProfile({
                program: profile.course || null,
                semester: semNumber
            });
            if (setUserDetail && profile.name) {
                setUserDetail(prev => ({
                    ...prev,
                    name: profile.name,
                    program: profile.course,
                    semester: semNumber
                }));
            }
        }
    }, [profileData, setUserDetail]);

    // Dynamic Courses and Semesters State (purely loaded from DB APIs)
    const [coursesList, setCoursesList] = useState([]);
    const [availableSemesters, setAvailableSemesters] = useState([]);

    // Fetch dynamic course choices from DB (parallel execution via Promise.all)
    useEffect(() => {
        const fetchCoursesList = async () => {
            try {
                const [res, availRes] = await Promise.all([
                    axios.get("/api/courses?limit=100"),
                    axios.get("/api/available-courses")
                ]);

                let dynamicCategories = [];
                if (res.data?.success && res.data.courses?.length > 0) {
                    dynamicCategories = res.data.courses
                        .map(c => c.category || c.title)
                        .filter(Boolean);
                }

                let availableCourses = [];
                if (availRes.data?.success && availRes.data.courses?.length > 0) {
                    availableCourses = availRes.data.courses;
                }

                const combined = Array.from(new Set([...dynamicCategories, ...availableCourses]));
                setCoursesList(combined);
            } catch (err) {
                console.error("Error fetching courses list in dashboard:", err);
            }
        };
        fetchCoursesList();
    }, []);

    // Fetch dynamic semester choices whenever selected program changes (strictly from DB API)
    useEffect(() => {
        if (!academicProfile.program) return;
        const fetchSemestersForCourse = async () => {
            try {
                const res = await axios.get(`/api/semesters?course=${encodeURIComponent(academicProfile.program)}`);
                if (res.data.success && res.data.semesters?.length > 0) {
                    setAvailableSemesters(res.data.semesters);
                } else {
                    setAvailableSemesters([]);
                }
            } catch (err) {
                console.error("Error fetching semesters for course:", err);
                setAvailableSemesters([]);
            }
        };
        fetchSemestersForCourse();
    }, [academicProfile.program]);

    const [selectedSubjectId, setSelectedSubjectId] = useState('all');

    // Subject Filter State inside Dashboard
    const [subjectSearchQuery, setSubjectSearchQuery] = useState("");
    const [materialTypeFilter, setMaterialTypeFilter] = useState("all");

    // React Query: Fetch semester subjects & materials ONLY AFTER user profile is loaded
    const programCode = academicProfile.program ? academicProfile.program.toLowerCase() : null;
    const semesterId = academicProfile.semester ? `semester-${academicProfile.semester}` : null;
    const { data: semesterData, isLoading: isLoadingSemester } = useSemesterDetail(
        programCode,
        semesterId,
        isProfileLoaded && Boolean(academicProfile.program)
    );
    
    const loadingSubjects = isLoadingProfile || !isProfileLoaded || !academicProfile.program || isLoadingSemester;
    const semesterSubjects = semesterData?.subjects || [];

    // Fetch ALL notes from database with React Query caching
    const { data: popularNotesData, isLoading: loadingPopularNotes } = usePopularNotes(100, true);
    const popularNotes = popularNotesData?.notes || [];

    // Greeting according to time of day
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 17) return "Good Afternoon";
        return "Good Evening";
    };

    const handleDownloadNote = (note) => {
        consumeCreditAndDownload({
            fileUrl: note.fileUrl || note.downloadUrl,
            fileName: note.title,
            fileType: note.type,
            materialId: note.id,
            userDetail,
            setUserDetail,
        });
    };

    const handleShareNote = (note) => {
        if (navigator.share) {
            navigator.share({
                title: note.title,
                text: note.description,
                url: note.fileUrl || note.downloadUrl
            });
            toast.success("Shared successfully!");
        } else {
            navigator.clipboard.writeText(note.fileUrl || note.downloadUrl || window.location.href);
            toast.success("Link copied to clipboard!");
        }
    };

    // Filter subjects based on active selection
    const filteredSubjects = selectedSubjectId === 'all'
        ? semesterSubjects
        : semesterSubjects.filter(sub => sub.id === selectedSubjectId);

    const totalSemesterNotesCount = semesterSubjects.reduce(
        (acc, sub) => acc + (sub.materials?.length || 0), 0
    );

    // Subject Color Themes Generator
    const getSubjectTheme = (index) => {
        const themes = [
            { bg: "bg-blue-500/10 dark:bg-blue-500/20", border: "border-blue-500/30", text: "text-blue-600 dark:text-blue-400", badgeBg: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300", gradient: "from-blue-600 to-indigo-600" },
            { bg: "bg-purple-500/10 dark:bg-purple-500/20", border: "border-purple-500/30", text: "text-purple-600 dark:text-purple-400", badgeBg: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300", gradient: "from-purple-600 to-pink-600" },
            { bg: "bg-emerald-500/10 dark:bg-emerald-500/20", border: "border-emerald-500/30", text: "text-emerald-600 dark:text-emerald-400", badgeBg: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300", gradient: "from-emerald-600 to-teal-600" },
            { bg: "bg-amber-500/10 dark:bg-amber-500/20", border: "border-amber-500/30", text: "text-amber-600 dark:text-amber-400", badgeBg: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300", gradient: "from-amber-500 to-orange-600" },
            { bg: "bg-cyan-500/10 dark:bg-cyan-500/20", border: "border-cyan-500/30", text: "text-cyan-600 dark:text-cyan-400", badgeBg: "bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300", gradient: "from-cyan-600 to-blue-600" },
            { bg: "bg-rose-500/10 dark:bg-rose-500/20", border: "border-rose-500/30", text: "text-rose-600 dark:text-rose-400", badgeBg: "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300", gradient: "from-rose-600 to-red-600" },
        ];
        return themes[index % themes.length];
    };

    // Filter materials based on search query and material type filter
    const getFilteredMaterials = (materials) => {
        if (!materials) return [];
        return materials.filter(note => {
            const titleLower = (note.title || '').toLowerCase();
            const descLower = (note.description || '').toLowerCase();
            const typeLower = (note.type || '').toLowerCase();
            const categoryLower = (note.category || '').toLowerCase();
            const tagsLower = Array.isArray(note.tags) ? note.tags.join(' ').toLowerCase() : (note.tags || '').toLowerCase();

            const queryLower = subjectSearchQuery.toLowerCase();
            const matchesSearch = !subjectSearchQuery ||
                titleLower.includes(queryLower) ||
                descLower.includes(queryLower) ||
                typeLower.includes(queryLower) ||
                categoryLower.includes(queryLower) ||
                tagsLower.includes(queryLower);

            let matchesType = true;
            if (materialTypeFilter === 'pyq') {
                matchesType = titleLower.includes('pyq') ||
                    descLower.includes('pyq') ||
                    typeLower.includes('pyq') ||
                    categoryLower.includes('pyq') ||
                    tagsLower.includes('pyq') ||
                    titleLower.includes('paper') ||
                    titleLower.includes('question') ||
                    titleLower.includes('exam') ||
                    descLower.includes('paper') ||
                    descLower.includes('question');
            } else if (materialTypeFilter === 'notes') {
                const isPyq = titleLower.includes('pyq') ||
                    descLower.includes('pyq') ||
                    typeLower.includes('pyq') ||
                    categoryLower.includes('pyq') ||
                    tagsLower.includes('pyq');
                matchesType = !isPyq;
            } else if (materialTypeFilter !== 'all') {
                matchesType = typeLower.includes(materialTypeFilter.toLowerCase()) ||
                    titleLower.includes(materialTypeFilter.toLowerCase());
            }

            return matchesSearch && matchesType;
        });
    };

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-[rgb(30,30,28)] text-slate-900 dark:text-slate-100 p-6 lg:p-10 transition-colors duration-300">
            <div className="max-w-7xl mx-auto space-y-12">

                {/* 1️⃣ USER PERSONALIZED WELCOME BANNER (Clean, Subtle Header) */}
                <div className="rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-[rgb(38,38,36)] p-5 md:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                            {getGreeting()}, <span className="text-blue-600 dark:text-blue-400">{userDetail?.name || "Keshav"}</span>
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Access your personalized study materials, handwritten notes & previous year papers
                        </p>
                    </div>

                    {/* Interactive Course & Semester Dropdown Select Badges */}
                    {!academicProfile.program || isLoadingProfile ? (
                        <div className="flex items-center gap-2 animate-pulse">
                            <div className="w-24 h-9 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                            <div className="w-28 h-9 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
                            {/* Course / Program Select Badge */}
                            <Select
                                value={academicProfile.program || ''}
                                onValueChange={async (val) => {
                                    const newProgram = val;
                                    let newSemesters = [];
                                    try {
                                        const res = await axios.get(`/api/semesters?course=${encodeURIComponent(newProgram)}`);
                                        if (res.data.success && res.data.semesters?.length > 0) {
                                            newSemesters = res.data.semesters;
                                        }
                                    } catch (e) {
                                        console.error("Error fetching semesters on program change:", e);
                                    }
                                    setAvailableSemesters(newSemesters);

                                    const currentSemNumber = academicProfile.semester || "1";
                                    const matchedSem = newSemesters.find(s => String(s).replace(/[^0-9]/g, "") === currentSemNumber);
                                    const nextSemNum = matchedSem ? currentSemNumber : (newSemesters[0] ? (String(newSemesters[0]).replace(/[^0-9]/g, "") || "1") : "1");
                                    const fullSemString = matchedSem || newSemesters[0] || `Semester ${nextSemNum}`;

                                    setAcademicProfile(prev => ({ ...prev, program: newProgram, semester: nextSemNum }));
                                    if (setUserDetail) setUserDetail(prev => ({ ...prev, program: newProgram, semester: nextSemNum }));

                                    try {
                                        await axios.post("/api/user-profile", {
                                            name: userDetail?.name || "Student",
                                            course: newProgram,
                                            semester: fullSemString
                                        });

                                        queryClient.setQueryData(['userProfile'], (oldData) => {
                                            if (!oldData) return oldData;
                                            return {
                                                ...oldData,
                                                profile: {
                                                    ...oldData.profile,
                                                    course: newProgram,
                                                    semester: fullSemString
                                                }
                                            };
                                        });
                                        queryClient.invalidateQueries({ queryKey: ['userProfile'] });
                                    } catch (saveErr) {
                                        console.error("Error updating user profile:", saveErr);
                                    }

                                    toast.success(`Switched course to ${newProgram}!`);
                                }}
                            >
                                <SelectTrigger className="h-9 px-3 rounded-xl bg-slate-100 dark:bg-[rgb(30,30,28)] hover:bg-slate-200 dark:hover:bg-[rgb(45,45,42)] border border-slate-200/80 dark:border-slate-700/70 text-slate-900 dark:text-white font-semibold text-xs shadow-2xs focus:ring-1 focus:ring-blue-500 gap-1.5 cursor-pointer">
                                    <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                    <SelectValue placeholder="Select Program" />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-[rgb(30,30,28)] border-gray-200 dark:border-gray-800 text-slate-900 dark:text-white rounded-xl shadow-xl max-h-60 overflow-y-auto">
                                    {coursesList.map((c) => (
                                        <SelectItem key={c} value={c} className="font-semibold text-xs py-1.5 cursor-pointer">
                                            {c}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Semester Select Badge */}
                            <Select
                                value={
                                    availableSemesters.find(s => (String(s).replace(/[^0-9]/g, "") || String(s)) === academicProfile.semester) ||
                                    (academicProfile.semester ? (academicProfile.semester.startsWith("Semester") ? academicProfile.semester : `Semester ${academicProfile.semester}`) : '')
                                }
                                onValueChange={async (val) => {
                                    const semNum = String(val).replace(/[^0-9]/g, "") || String(val);
                                    const fullSemString = String(val).startsWith("Semester") ? val : `Semester ${val}`;

                                    setAcademicProfile(prev => ({ ...prev, semester: semNum }));
                                    if (setUserDetail) setUserDetail(prev => ({ ...prev, semester: semNum }));

                                    try {
                                        await axios.post("/api/user-profile", {
                                            name: userDetail?.name || "Student",
                                            course: academicProfile.program,
                                            semester: fullSemString
                                        });

                                        queryClient.setQueryData(['userProfile'], (oldData) => {
                                            if (!oldData) return oldData;
                                            return {
                                                ...oldData,
                                                profile: {
                                                    ...oldData.profile,
                                                    course: academicProfile.program,
                                                    semester: fullSemString
                                                }
                                            };
                                        });
                                        queryClient.invalidateQueries({ queryKey: ['userProfile'] });
                                    } catch (saveErr) {
                                        console.error("Error updating user profile:", saveErr);
                                    }

                                    toast.success(`Switched to ${fullSemString}!`);
                                }}
                            >
                                <SelectTrigger className="h-9 px-3 rounded-xl bg-slate-100 dark:bg-[rgb(30,30,28)] hover:bg-slate-200 dark:hover:bg-[rgb(45,45,42)] border border-slate-200/80 dark:border-slate-700/70 text-slate-900 dark:text-white font-semibold text-xs shadow-2xs focus:ring-1 focus:ring-blue-500 gap-1.5 cursor-pointer">
                                    <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                    <SelectValue placeholder="Select Semester" />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-[rgb(30,30,28)] border-gray-200 dark:border-gray-800 text-slate-900 dark:text-white rounded-xl shadow-xl max-h-60 overflow-y-auto">
                                    {availableSemesters.map((semItem) => {
                                        const semLabel = String(semItem).startsWith("Semester") ? semItem : `Semester ${semItem}`;
                                        return (
                                            <SelectItem key={semItem} value={semItem} className="font-semibold text-xs py-1.5 cursor-pointer">
                                                {semLabel}
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                {/* 2️⃣ YOUR SEMESTER NOTES & MATERIALS */}
                <section className="space-y-6">
                    {/* SECTION HEADER */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                                    <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    Subject Wise Notes & Materials
                                </h2>
                               
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Select a subject from the dropdown to filter handwritten notes, modules, and study guides
                            </p>
                        </div>

                        <Link href={`/library/${(academicProfile.program || 'all').toLowerCase()}`}>
                            <Button variant="outline" className="group h-9 px-4 border-slate-300 dark:border-slate-700 bg-white dark:bg-[rgb(30,30,28)] hover:bg-slate-100 dark:hover:bg-[rgb(45,45,42)] text-slate-900 dark:text-white font-semibold rounded-xl text-xs flex items-center gap-2">
                                <span>Go to Full Library</span>
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </div>

                    {/* MINIMAL SEARCH, SUBJECT DROPDOWN & FILTER CONTROLS BAR */}
                    {semesterSubjects.length > 0 && (
                        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-[rgb(38,38,36)] border border-gray-200/80 dark:border-gray-800 shadow-xs">
                            {/* Subject Dropdown Menu */}
                            <div className="w-full lg:w-72 flex items-center gap-2">
                                <Select value={selectedSubjectId} onValueChange={(val) => setSelectedSubjectId(val)}>
                                    <SelectTrigger className="w-full h-10 rounded-xl bg-slate-50 dark:bg-[rgb(30,30,28)] border-gray-200 dark:border-gray-700 font-semibold text-xs shadow-xs focus:ring-2 focus:ring-blue-500">
                                        <div className="flex items-center gap-2 truncate text-slate-800 dark:text-slate-200">
                                            <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                            <SelectValue placeholder="Select Subject" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-[rgb(30,30,28)] border-gray-200 dark:border-gray-800 rounded-xl shadow-xl">
                                        <SelectItem value="all" className="font-semibold text-xs py-2">
                                            All Subjects ({totalSemesterNotesCount} Notes Total)
                                        </SelectItem>
                                        {semesterSubjects.map((sub) => (
                                            <SelectItem key={sub.id} value={sub.id} className="font-medium text-xs py-2">
                                                {sub.name} {sub.code ? `(${sub.code})` : ''} • {sub.materials?.length || 0} notes
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Search Box */}
                            <div className="relative w-full lg:w-80">
                                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search notes by title or topic..."
                                    value={subjectSearchQuery}
                                    onChange={(e) => setSubjectSearchQuery(e.target.value)}
                                    className="w-full h-10 pl-10 pr-4 bg-slate-50 dark:bg-[rgb(30,30,28)] text-slate-900 dark:text-white rounded-xl text-xs font-medium border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                                {subjectSearchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSubjectSearchQuery('')}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>

                            {/* Type Filter Pills */}
                            <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto scrollbar-none">
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 hidden xl:inline-block mr-1">Type:</span>
                                {[
                                    { id: 'all', label: 'All Notes' },
                                    { id: 'notes', label: 'Handwritten' },
                                    { id: 'pyq', label: 'PYQs' },
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setMaterialTypeFilter(tab.id)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                                            materialTypeFilter === tab.id
                                                ? 'bg-blue-600 text-white shadow-xs'
                                                : 'bg-slate-100 dark:bg-[rgb(30,30,28)] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[rgb(45,45,42)]'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SUBJECTS & NOTES DISPLAY AREA */}
                    {loadingSubjects ? (
                        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <GenericCardSkeleton key={i} showImageHeader={false} />
                            ))}
                        </div>
                    ) : filteredSubjects.length > 0 ? (
                        <div className="space-y-8">
                            {filteredSubjects.map((subject, idx) => {
                                const theme = getSubjectTheme(idx);
                                const displayedMaterials = getFilteredMaterials(subject.materials);

                                return (
                                    <div
                                        key={subject.id}
                                        className="p-5 md:p-6 rounded-2xl bg-white dark:bg-[rgb(38,38,36)] border border-gray-200/80 dark:border-gray-800 shadow-xs space-y-5"
                                    >
                                        {/* Subject Header Banner */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${theme.bg} ${theme.text} ${theme.border} flex-shrink-0 shadow-xs`}>
                                                    <BookOpen className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                                            {subject.name}
                                                        </h3>
                                                
                                                    </div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                                                        {subject.materials?.length || 0} handwritten study materials available for {academicProfile.program || ''} Sem {academicProfile.semester || ''}
                                                    </p>
                                                </div>
                                            </div>

                                        
                                        </div>

                                        {/* Notes Grid Inside This Subject */}
                                        {displayedMaterials.length > 0 ? (
                                            <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                                {displayedMaterials.map((note) => (
                                                    <GenericCard
                                                        key={note.id}
                                                        item={note}
                                                        imageUrl={note.imageUrl}
                                                        title={note.title}
                                                        subtitle={note.description || `${subject.name} study material`}
                                                        showStats={true}
                                                        showImageHeader={false}
                                                        viewLabel="Learn"
                                                        badges={[
                                                            { label: note.type || 'PDF', position: 'top-left' }
                                                        ]}
                                                        actions={[
                                                            {
                                                                label: 'Download',
                                                                onClick: () => handleDownloadNote(note),
                                                                fullWidth: true,
                                                                icon: isOutOfCredits ? <Lock className="w-4 h-4" /> : <Download className="w-4 h-4" />
                                                            },
                                                            {
                                                                label: '',
                                                                onClick: () => handleShareNote(note),
                                                                variant: 'outline',
                                                                icon: <Share2 className="w-4 h-4" />
                                                            }
                                                        ]}
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700 space-y-1.5">
                                                <FileText className="w-8 h-8 mx-auto text-slate-400" />
                                                <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                                                    {subjectSearchQuery || materialTypeFilter !== 'all'
                                                        ? `No notes match your active filter "${subjectSearchQuery || materialTypeFilter}"`
                                                        : `No study materials currently uploaded for ${subject.name}`}
                                                </p>
                                                {(subjectSearchQuery || materialTypeFilter !== 'all') && (
                                                    <button
                                                        type="button"
                                                        onClick={() => { setSubjectSearchQuery(''); setMaterialTypeFilter('all'); }}
                                                        className="text-xs text-blue-600 font-semibold hover:underline"
                                                    >
                                                        Clear Search & Filters
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 rounded-2xl bg-white dark:bg-[rgb(38,38,36)] border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
                            <FileText className="w-12 h-12 mx-auto text-slate-400" />
                            <p className="text-slate-800 dark:text-slate-200 font-bold text-base">
                                No subjects found for {academicProfile.program || ''} Semester {academicProfile.semester || ''}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Try customizing your academic profile preferences using the button at the top
                            </p>
                        </div>
                    )}
                </section>

                {/* 3️⃣ TOP LIKED NOTES (Most Liked 3 Notes + View More) */}
                <section className="space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
                        <div className="space-y-1">
                            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-amber-500" />
                                Top Liked Notes
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Most popular study materials voted by students
                            </p>
                        </div>

                        <Link href="/dashboard/allNotes">
                            <Button variant="outline" className="h-9 px-4 border-slate-300 dark:border-slate-700 bg-white dark:bg-[rgb(30,30,28)] hover:bg-slate-100 dark:hover:bg-[rgb(45,45,42)] text-slate-900 dark:text-white font-semibold rounded-xl text-xs flex items-center gap-2">
                                <span>View All Notes</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                        </Link>
                    </div>

                    {loadingPopularNotes ? (
                        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <GenericCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : popularNotes.length > 0 ? (
                        <>
                            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                {[...popularNotes]
                                    .sort((a, b) => (b.likes || 0) - (a.likes || 0))
                                    .slice(0, 3)
                                    .map((note) => {
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
                                                showImageHeader={false}
                                                badges={[
                                                    { label: 'Popular', position: 'top-right' },
                                                    { label: note.type || 'PDF', position: 'top-left' }
                                                ]}
                                                actions={[
                                                    {
                                                        label: 'Download',
                                                        onClick: () => handleDownloadNote(note),
                                                        fullWidth: true,
                                                        icon: isOutOfCredits ? <Lock className="w-4 h-4" /> : <Download className="w-4 h-4" />
                                                    },
                                                    {
                                                        label: '',
                                                        onClick: () => handleShareNote(note),
                                                        variant: 'outline',
                                                        icon: <Share2 className="w-4 h-4" />
                                                    }
                                                ]}
                                            />
                                        );
                                    })}
                            </div>

                            {/* View More Button */}
                            <div className="flex justify-center pt-4">
                                <Link href="/dashboard/allNotes">
                                    <Button variant="outline" className="h-11 px-8 rounded-xl font-bold text-xs flex items-center gap-2 border-slate-300 dark:border-slate-700 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition-all shadow-xs group">
                                        <span>View More Notes</span>
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </Link>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12 rounded-2xl bg-white dark:bg-[rgb(38,38,36)] border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
                            <FileText className="w-12 h-12 mx-auto text-slate-400" />
                            <p className="text-slate-800 dark:text-slate-200 font-bold text-base">No notes found</p>
                        </div>
                    )}
                </section>

            </div>
        </div>
    );
}
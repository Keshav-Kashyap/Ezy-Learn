"use client";

import React, { useState, useEffect, useContext } from "react";
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
import GenericCard from "../_components/shared/GenericCard";
import GenericCardSkeleton from "../_components/skeletons/GenericCardSkeleton";
import { UserDetailContext } from "@/context/UserDetailContext";
import { useDashboardData, usePopularNotes } from "@/hooks/useCourses";
import { consumeCreditAndDownload } from "@/lib/downloadHelper";
import { toast } from "sonner";

export default function Dashboard2Page() {
    const { userDetail, setUserDetail } = useContext(UserDetailContext) || {};
    const isAdmin = userDetail?.role === 'admin';
    const isOutOfCredits = !isAdmin && (userDetail?.credits ?? 0) <= 0;

    // Academic Profile Preferences State (Default to MCA • Semester 2 • AKTU)
    const [academicProfile, setAcademicProfile] = useState({
        program: userDetail?.program || userDetail?.course || "MCA",
        semester: userDetail?.semester || "2",
        university: userDetail?.university || "AKTU"
    });

    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [semesterSubjects, setSemesterSubjects] = useState([]);
    const [loadingSubjects, setLoadingSubjects] = useState(true);
    const [selectedSubjectId, setSelectedSubjectId] = useState('all');

    // Subject Filter State inside Dashboard
    const [subjectSearchQuery, setSubjectSearchQuery] = useState("");
    const [materialTypeFilter, setMaterialTypeFilter] = useState("all");

    // Fetch dashboard stats & popular notes
    const { data: popularNotesData, isLoading: loadingPopularNotes } = usePopularNotes(6);
    const popularNotes = popularNotesData?.notes || [];

    // Greeting according to time of day
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 17) return "Good Afternoon";
        return "Good Evening";
    };

    // Fetch semester subjects & materials matching user's program & semester
    const fetchSemesterData = async () => {
        setLoadingSubjects(true);
        try {
            const programCode = academicProfile.program.toLowerCase();
            const semesterId = `semester-${academicProfile.semester}`;
            const res = await fetch(`/api/courses/${programCode}/semester/${semesterId}`);
            const data = await res.json();
            if (data.success && data.semester?.subjects) {
                setSemesterSubjects(data.semester.subjects || []);
                setSelectedSubjectId('all');
            } else {
                setSemesterSubjects([]);
            }
        } catch (err) {
            console.error("Error fetching semester subjects:", err);
            setSemesterSubjects([]);
        } finally {
            setLoadingSubjects(false);
        }
    };

    useEffect(() => {
        fetchSemesterData();
    }, [academicProfile.program, academicProfile.semester]);

    // Save profile preferences update
    const handleSaveProfile = () => {
        setIsProfileModalOpen(false);
        if (setUserDetail && userDetail) {
            setUserDetail(prev => ({
                ...prev,
                program: academicProfile.program,
                semester: academicProfile.semester,
                university: academicProfile.university
            }));
        }
        toast.success(`Academic Profile updated to ${academicProfile.program} Sem ${academicProfile.semester}!`);
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



    // Filter subjects based on active pill / card selection
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
            const titleMatch = note.title?.toLowerCase().includes(subjectSearchQuery.toLowerCase());
            const descMatch = note.description?.toLowerCase().includes(subjectSearchQuery.toLowerCase());
            const matchesSearch = !subjectSearchQuery || titleMatch || descMatch;
            const matchesType = materialTypeFilter === 'all' || 
                (note.type && note.type.toLowerCase().includes(materialTypeFilter.toLowerCase()));
            return matchesSearch && matchesType;
        });
    };

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-[rgb(30,30,28)] text-slate-900 dark:text-slate-100 p-6 lg:p-10 transition-colors duration-300">
            <div className="max-w-7xl mx-auto space-y-12">

                {/* 1️USER PERSONALIZED WELCOME BANNER (Clean, Subtle Header) */}
                <div className="rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-[rgb(38,38,36)] p-5 md:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold text-xs border border-blue-200/50 dark:border-blue-900/30">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Personalized Learning Hub</span>
                        </div>

                        <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                            {getGreeting()}, <span className="text-blue-600 dark:text-blue-400">{userDetail?.name || "Keshav"}</span>
                        </h1>

                        <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600 dark:text-slate-300 font-medium pt-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 font-semibold text-slate-700 dark:text-slate-300">
                                <GraduationCap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                {academicProfile.program}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 font-semibold text-slate-700 dark:text-slate-300">
                                <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                Semester {academicProfile.semester}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 font-semibold text-slate-700 dark:text-slate-300">
                                <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                {academicProfile.university}
                            </span>
                        </div>
                    </div>

                    {/* Edit Academic Profile Button */}
                    <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="h-10 px-4 border-gray-200 dark:border-gray-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-semibold rounded-xl text-xs flex items-center gap-2 self-start md:self-auto shadow-xs">
                                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                <span>Customize Academic Profile</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 rounded-3xl">
                            <DialogHeader>
                                <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <GraduationCap className="w-5 h-5 text-blue-600" />
                                    Customize Academic Preferences
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-3">
                                <div>
                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Degree / Program</label>
                                    <Select
                                        value={academicProfile.program}
                                        onValueChange={(val) => setAcademicProfile(prev => ({ ...prev, program: val }))}
                                    >
                                        <SelectTrigger className="h-11 rounded-xl text-xs font-medium">
                                            <SelectValue placeholder="Select Program" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="MCA">MCA (Master of Computer Applications)</SelectItem>
                                            <SelectItem value="BCA">BCA (Bachelor of Computer Applications)</SelectItem>
                                            <SelectItem value="BTech">B.Tech (Computer Science / IT)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Current Semester</label>
                                    <Select
                                        value={academicProfile.semester}
                                        onValueChange={(val) => setAcademicProfile(prev => ({ ...prev, semester: val }))}
                                    >
                                        <SelectTrigger className="h-11 rounded-xl text-xs font-medium">
                                            <SelectValue placeholder="Select Semester" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                                                <SelectItem key={sem} value={String(sem)}>Semester {sem}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">University / Board</label>
                                    <Select
                                        value={academicProfile.university}
                                        onValueChange={(val) => setAcademicProfile(prev => ({ ...prev, university: val }))}
                                    >
                                        <SelectTrigger className="h-11 rounded-xl text-xs font-medium">
                                            <SelectValue placeholder="Select University" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="AKTU">AKTU (Dr. A.P.J. Abdul Kalam Technical University)</SelectItem>
                                            <SelectItem value="IPU">GGSIPU (Indraprastha University)</SelectItem>
                                            <SelectItem value="DU">Delhi University (DU)</SelectItem>
                                            <SelectItem value="GTU">Gujarat Technological University</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleSaveProfile} className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs">
                                    Save & Personalize Dashboard
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
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
                                <Badge className="bg-blue-600 text-white font-semibold text-xs px-3 py-0.5 rounded-full shadow-xs">
                                    {academicProfile.program} • Sem {academicProfile.semester}
                                </Badge>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Select a subject from the dropdown to filter handwritten notes, modules, and study guides
                            </p>
                        </div>

                        <Link href={`/library/${academicProfile.program.toLowerCase()}`}>
                            <Button variant="outline" className="group h-9 px-4 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-semibold rounded-xl text-xs flex items-center gap-2">
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
                                    <SelectTrigger className="w-full h-10 rounded-xl bg-slate-50 dark:bg-slate-800/60 border-gray-200 dark:border-gray-700 font-semibold text-xs shadow-xs focus:ring-2 focus:ring-blue-500">
                                        <div className="flex items-center gap-2 truncate text-slate-800 dark:text-slate-200">
                                            <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                            <SelectValue placeholder="Select Subject" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 rounded-xl shadow-xl">
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
                                    className="w-full h-10 pl-10 pr-4 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white rounded-xl text-xs font-medium border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
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
                                    { id: 'pdf', label: 'PDF Documents' },
                                    { id: 'notes', label: 'Handwritten' },
                                    { id: 'pyq', label: 'PYQs & Exam' },
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setMaterialTypeFilter(tab.id)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                                            materialTypeFilter === tab.id
                                                ? 'bg-blue-600 text-white shadow-xs'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
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
                        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-[rgb(38,38,36)] rounded-2xl border border-gray-200/80 dark:border-gray-800 space-y-3">
                            <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
                            <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">Loading subject notes & materials...</span>
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
                                                        {subject.code && (
                                                            <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${theme.badgeBg}`}>
                                                                {subject.code}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                                                        {subject.materials?.length || 0} handwritten study materials available for {academicProfile.program} Sem {academicProfile.semester}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 self-start sm:self-auto">
                                                <Badge className={`font-semibold text-xs px-3 py-1 rounded-lg border ${theme.badgeBg}`}>
                                                    {displayedMaterials.length} {displayedMaterials.length === 1 ? 'Note' : 'Notes'} Shown
                                                </Badge>
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
                                No subjects found for {academicProfile.program} Semester {academicProfile.semester}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Try customizing your academic profile preferences using the button at the top
                            </p>
                        </div>
                    )}
                </section>

                {/* 3️⃣ ALL NOTES */}
                <section className="space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
                        <div className="space-y-1">
                            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-amber-500" />
                                All Notes
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Most downloaded study materials across all programs
                            </p>
                        </div>

                        <Link href="/dashboard/popular">
                            <Button className="group h-9 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-xl shadow-xs text-xs flex items-center gap-2">
                                <span>See All Notes</span>
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </div>

                    {loadingPopularNotes ? (
                        <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <GenericCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : (
                        <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
                            {popularNotes.slice(0, 3).map((note) => (
                                <GenericCard
                                    key={note.id}
                                    item={note}
                                    imageUrl={note.imageUrl}
                                    title={note.title}
                                    subtitle={note.description}
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
                            ))}
                        </div>
                    )}
                </section>

            </div>
        </div>
    );
}

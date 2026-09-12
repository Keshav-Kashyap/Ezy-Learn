"use client"

import React, { useState, useEffect, useContext, useRef } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';

import {
    Search,
    Bell,
    Menu,
    Sun,
    Moon,
    Sparkles,
    FileText,
    BookOpen,
    Download,
    Lock,
    Loader2,
    X,
    CreditCard
} from 'lucide-react';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { UserButton } from '@clerk/nextjs';
import { UserDetailContext } from '@/context/UserDetailContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCourses } from '@/hooks/useCourses';
import { consumeCreditAndDownload } from '@/lib/downloadHelper';
import { toast } from 'sonner';

const Navbar = ({ onOpenAI }) => {
    const { userDetail, setUserDetail } = useContext(UserDetailContext) || {};
    const isAdmin = userDetail?.role === 'admin';
    const isOutOfCredits = !isAdmin && (userDetail?.credits ?? 0) <= 0;

    const { setOpen } = useSidebar();

    const [searchQuery, setSearchQuery] = useState('');
    const [notesResults, setNotesResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);

    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();

    const searchRef = useRef(null);

    // Fetch real courses using hook
    const { data: courses = [] } = useCourses();

    // Filter matching courses
    const filteredCourses = searchQuery.trim() ? (courses || []).filter(c =>
        (c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    ) : [];

    // Search study materials via API
    useEffect(() => {
        if (!searchQuery.trim()) {
            setNotesResults([]);
            setIsSearching(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`);
                const data = await res.json();
                if (data.success) {
                    setNotesResults(data.results || []);
                }
            } catch (err) {
                console.error("Navbar search fetch error:", err);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Ensure component is mounted
    useEffect(() => {
        setMounted(true);
    }, []);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsSearchDropdownOpen(false);
            }
            if (!event.target.closest('.notification-dropdown')) {
                setShowNotifications(false);
            }
            if (!event.target.closest('.profile-dropdown')) {
                setShowProfile(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDownloadNote = (note) => {
        consumeCreditAndDownload({
            fileUrl: note.fileUrl,
            fileName: note.title,
            fileType: note.type,
            materialId: note.id,
            userDetail,
            setUserDetail,
        });
    };

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const handleMenuClick = () => {
        setOpen(true);
    };

    if (!mounted) {
        return null;
    }

    return (
        <nav className="w-full h-16 bg-white dark:bg-[rgb(38,38,36)] text-gray-900 dark:text-white flex items-center justify-between px-4 md:px-6 sticky top-0 z-40 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300 ease-in-out">

            {/* Left Side - Mobile Menu & Brand */}
            <div className="flex items-center gap-2 md:gap-4">
                <div className="md:hidden">
                    <SidebarTrigger onClick={handleMenuClick} className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 hover:bg-gray-100 dark:hover:bg-[rgb(45,45,44)] transition-all duration-300 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:cursor-w-resize" >
                        <Menu size={18} />
                    </SidebarTrigger>
                </div>

                <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                    EzyLearn
                </h1>
            </div>

            {/* Center - Inline Navbar Search with Live Floating Results Dropdown */}
            <div className="flex-1 max-w-[200px] md:max-w-md mx-2 md:mx-8 relative" ref={searchRef}>
                <div className="relative w-full">
                    <Search className="absolute left-2.5 md:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" size={16} />
                    <input
                        type="text"
                        placeholder="Search notes, subjects, courses..."
                        value={searchQuery}
                        onFocus={() => setIsSearchDropdownOpen(true)}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setIsSearchDropdownOpen(true);
                        }}
                        className="w-full pl-8 md:pl-10 pr-8 md:pr-10 py-1.5 md:py-2 rounded-lg bg-gray-50 dark:bg-[#30302E] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-200 dark:border-gray-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs md:text-sm"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setIsSearchDropdownOpen(false);
                            }}
                            className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Inline Quick Search Floating Dropdown */}
                {isSearchDropdownOpen && searchQuery.trim().length > 0 && (
                    <div className="absolute left-1/2 transform -translate-x-1/2 md:translate-x-0 md:left-0 top-full mt-2 w-[92vw] sm:w-[480px] md:w-[560px] max-h-[75vh] overflow-y-auto rounded-xl bg-white dark:bg-[rgb(30,30,28)] border border-gray-200 dark:border-gray-700 shadow-2xl z-50 p-4 space-y-4 text-left">
                        {isSearching ? (
                            <div className="flex items-center justify-center py-8 text-gray-500 gap-2 text-sm">
                                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                <span>Searching all study materials...</span>
                            </div>
                        ) : notesResults.length === 0 && filteredCourses.length === 0 ? (
                            <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
                                No notes or courses found matching "{searchQuery}"
                            </div>
                        ) : (
                            <>
                                {/* Individual Study Notes Results */}
                                {notesResults.length > 0 && (
                                    <div>
                                        <div className="flex items-center justify-between mb-2 pb-1 border-b border-gray-100 dark:border-gray-800">
                                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                                                <FileText className="w-3.5 h-3.5 text-blue-600" /> Study Notes & PDFs ({notesResults.length})
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            {notesResults.map((note) => {
                                                return (
                                                    <div
                                                        key={note.id}
                                                        className="p-3 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-[rgb(40,40,38)] dark:hover:bg-[rgb(48,48,45)] border border-slate-200/60 dark:border-gray-700/60 transition-all flex items-center justify-between gap-3"
                                                    >
                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-bold text-slate-900 dark:text-white text-xs truncate">
                                                                {note.displayTitle || note.title}
                                                            </p>
                                                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                                                <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-extrabold text-[10px]">
                                                                    {note.type || 'PDF'}
                                                                </span>
                                                                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                                                    • {note.downloadCount || note.downloads || 0} downloads
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleDownloadNote(note)}
                                                            className="h-8 px-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md shadow-xs flex items-center gap-1 flex-shrink-0"
                                                        >
                                                            {isOutOfCredits ? <Lock className="w-3 h-3" /> : <Download className="w-3 h-3" />}
                                                            <span>Download</span>
                                                        </Button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Matching Academic Courses */}
                                {filteredCourses.length > 0 && (
                                    <div>
                                        <div className="flex items-center justify-between mb-2 pb-1 border-b border-gray-100 dark:border-gray-800">
                                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                                                <BookOpen className="w-3.5 h-3.5 text-indigo-600" /> Degree Courses ({filteredCourses.length})
                                            </span>
                                        </div>
                                        <div className="space-y-1.5">
                                            {filteredCourses.map((course) => (
                                                <Link
                                                    key={course.id}
                                                    href={`/library/${course.category}`}
                                                    onClick={() => setIsSearchDropdownOpen(false)}
                                                    className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-[rgb(40,40,38)] dark:hover:bg-[rgb(48,48,45)] border border-slate-200/60 dark:border-gray-700/60 transition-all flex items-center justify-between text-xs group"
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className="p-1.5 rounded-md bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600">
                                                            <BookOpen className="w-4 h-4" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-slate-900 dark:text-white truncate group-hover:text-indigo-600">
                                                                {course.title}
                                                            </p>
                                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                                {course.category} • {course.documents || 0} documents
                                                            </p>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Right Side - AI, Theme Toggle, Notifications & Profile */}
            <div className="flex items-center gap-1 md:gap-2">

                {/* AI Button */}
                <button
                    onClick={onOpenAI}
                    className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300 ease-in-out shadow-md hover:shadow-lg"
                    aria-label="Open AI Assistant"
                    title="Chat with AI"
                >
                    <Sparkles size={20} className="text-white" />
                </button>

                {/* Theme Toggle Button */}
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[rgb(45,45,44)] transition-colors duration-300 ease-in-out"
                    aria-label="Toggle theme"
                >
                    {theme === 'dark' ? (
                        <Sun size={20} className="text-yellow-500" />
                    ) : (
                        <Moon size={20} className="text-gray-600" />
                    )}
                </button>

                {/* Bell Icon */}
                {/* <div className="relative notification-dropdown">
                    <button
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[rgb(45,45,44)] transition-colors duration-300 ease-in-out relative"
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <Bell size={20} className="text-gray-700 dark:text-gray-300" />
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                            <span className="text-xs text-white font-bold">3</span>
                        </span>
                    </button>

                
                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-[rgb(24,24,24)] rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 transition-all duration-300 ease-in-out">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                <div className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700 transition-colors">
                                    <p className="text-sm text-gray-900 dark:text-white">New assignment uploaded in MCA Library</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">2 hours ago</p>
                                </div>
                                <div className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700 transition-colors">
                                    <p className="text-sm text-gray-900 dark:text-white">Your billing cycle ends in 3 days</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">1 day ago</p>
                                </div>
                                <div className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                                    <p className="text-sm text-gray-900 dark:text-white">Welcome to EzyLearn!</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">3 days ago</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div> */}

                {/* User Profile */}
                <div className="relative profile-dropdown">
                    <button
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[rgb(45,45,44)] transition-colors duration-300 ease-in-out"
                        onClick={() => setShowProfile(!showProfile)}
                    >
                        {userDetail !== undefined && (
                            <Badge variant="secondary" className="hidden md:inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200 border border-blue-200 dark:border-blue-900">
                                <CreditCard className="h-3.5 w-3.5" />
                                {userDetail?.credits ?? 0} credits
                            </Badge>
                        )}

                        <UserButton
                            appearance={{
                                baseTheme: undefined,
                                elements: {
                                    avatarBox: "border-2 border-transparent",
                                },
                                variables: {
                                    colorPrimary: "black",
                                },
                            }}
                            afterSignOutUrl="/"
                        />

                        {userDetail === undefined ? (
                            <div className="hidden md:block">
                                <Skeleton className="h-4 w-20 rounded-md" />
                            </div>
                        ) : (
                            <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-200">
                                {userDetail?.name}
                            </span>
                        )}
                    </button>
                </div>

            </div>
        </nav>
    );
};

export default Navbar;

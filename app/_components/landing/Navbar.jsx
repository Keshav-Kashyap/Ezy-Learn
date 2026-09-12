"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import Link from "next/link";
import Image from "next/image";
import { UserButton } from "@clerk/nextjs";
import { Search, X, Download, Eye, Lock, CreditCard, Sun, Moon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserDetailContext } from "@/context/UserDetailContext";
import { consumeCreditAndDownload } from "@/lib/downloadHelper";
import { useUserProfile } from "@/hooks/useUser";

export default function Navbar({ onDashboard }) {
    const { user } = useUser();
    const { theme, setTheme } = useTheme();
    const { userDetail, setUserDetail } = useContext(UserDetailContext) || {};
    const isAdmin = userDetail?.role === 'admin';
    const isOutOfCredits = user && !isAdmin && (userDetail?.credits ?? 0) <= 0;
    const router = useRouter();
    const [isVisible, setIsVisible] = useState(true);

    const { data: userProfileData } = useUserProfile({ enabled: Boolean(user) });
    const hasProfile = Boolean(userProfileData?.hasProfile || userProfileData?.exists);

    const handleDashboardClick = () => {
        if (onDashboard) {
            onDashboard();
        } else if (user) {
            router.push(hasProfile ? '/dashboard' : '/create-profile');
        } else {
            router.push('/sign-in');
        }
    };
    const [lastScrollY, setLastScrollY] = useState(0);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };

    useEffect(() => {
        const controlNavbar = () => {
            const currentScrollY = window.scrollY;

            if (currentScrollY < 10) {
                setIsVisible(true);
            } else if (currentScrollY > lastScrollY) {
                setIsVisible(false);
            } else {
                setIsVisible(true);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', controlNavbar);
        return () => window.removeEventListener('scroll', controlNavbar);
    }, [lastScrollY]);

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            toast.error("Please enter a search query");
            return;
        }

        setSearching(true);
        setSearchOpen(true); // Ensure modal is open

        try {
            console.log("Searching for:", searchQuery);
            const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log("Search results:", data);

            if (data.success) {
                setSearchResults(data.results || []);
                if (data.results.length === 0) {
                    toast.info("No results found");
                } else {
                    toast.success(`Found ${data.results.length} results`);
                }
            } else {
                toast.error(data.error || "Search failed");
                setSearchResults([]);
            }
        } catch (error) {
            console.error("Search error:", error);
            toast.error("Failed to search. Please try again.");
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleAction = (material) => {
        if (!user) {
            toast.error("Please login to access materials");
            router.push('/sign-in');
        } else {
            window.open(material.fileUrl, '_blank');
        }
    };

    const handleDownloadMaterial = (material) => {
        if (!user) {
            toast.error("Please login to access materials");
            router.push('/sign-in');
        } else {
            consumeCreditAndDownload({
                fileUrl: material.fileUrl,
                fileName: material.title,
                fileType: material.type,
                userDetail,
                setUserDetail,
            });
        }
    };

    const closeSearch = () => {
        setSearchOpen(false);
        setSearchQuery("");
        setSearchResults([]);
    };

    return (
        <>
            <nav className={`fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-[rgb(38,38,36)]/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'
                }`}>
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between gap-4 py-4">
                        <Link href="/" className="flex items-center gap-3 flex-shrink-0">
                            <Image
                                src="/image.jpeg"
                                alt="Ezy Learn Logo"
                                width={40}
                                height={40}
                                className="rounded-xl"
                            />
                            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Ezy Learn</h1>
                        </Link>

                        {/* Center Search Input */}
                        <div className="hidden md:flex flex-1 max-w-xl mx-4">
                            <div className="relative w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder="Search materials, subjects, courses..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    onFocus={() => setSearchOpen(true)}
                                    className="w-full pl-10 pr-4 h-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-4 flex-shrink-0">
                            {mounted && (
                                <button
                                    onClick={toggleTheme}
                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[rgb(45,45,44)] transition-colors duration-300 ease-in-out"
                                    aria-label="Toggle theme"
                                    title="Toggle theme"
                                >
                                    {theme === "dark" ? (
                                        <Sun size={20} className="text-yellow-500" />
                                    ) : (
                                        <Moon size={20} className="text-gray-600 dark:text-gray-300" />
                                    )}
                                </button>
                            )}

                            {/* Navigation Links */}
                            <a
                                href="#billing"
                                onClick={(e) => {
                                    e.preventDefault();
                                    document.getElementById('billing')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="hidden lg:block text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors duration-300 cursor-pointer"
                            >
                                Billing
                            </a>

                            <a
                                href="/about"
                                className="hidden lg:block text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors duration-300 cursor-pointer"
                            >
                                About
                            </a>

                            {!user ? (
                                <Link href='/sign-in'>
                                    <button className="px-4 md:px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all duration-300">
                                        Login
                                    </button>
                                </Link>
                            ) : (
                                <div className="flex items-center gap-3">
                                    {userDetail !== undefined && (
                                        <Badge variant="secondary" className="hidden sm:inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200 border border-blue-200 dark:border-blue-900">
                                            <CreditCard className="h-3.5 w-3.5" />
                                            {userDetail?.credits ?? 0} credits
                                        </Badge>
                                    )}

                                    <UserButton />
                                    <button
                                        onClick={handleDashboardClick}
                                        className="px-4 md:px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all duration-300">
                                        Dashboard
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Search Modal */}
            {searchOpen && (
                <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm">
                    <div className="min-h-screen px-4 py-20">
                        <div className="max-w-4xl mx-auto">
                            {/* Search Bar */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 mb-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <Search className="h-6 w-6 text-gray-400" />
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Search Materials</h2>
                                    <button
                                        onClick={closeSearch}
                                        className="ml-auto p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="flex gap-3">
                                    <Input
                                        type="text"
                                        placeholder="Search by title, subject, or course..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        autoFocus
                                        className="flex-1 h-12 text-base"
                                    />
                                    <Button
                                        onClick={handleSearch}
                                        disabled={searching}
                                        className="h-12 px-6 bg-blue-600 hover:bg-blue-700"
                                    >
                                        {searching ? "Searching..." : "Search"}
                                    </Button>
                                </div>

                                {!user && searchResults.length > 0 && (
                                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                            <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            <span>Login required to view or download materials</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Search Results */}
                            {searching ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                    <p className="text-gray-600 dark:text-gray-400">Searching...</p>
                                </div>
                            ) : searchResults.length > 0 ? (
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-h-[calc(100vh-250px)] overflow-y-auto">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                        Found {searchResults.length} results
                                    </p>
                                    <div className="space-y-4">
                                        {searchResults.map((material) => (
                                            <div
                                                key={material.id}
                                                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-600 transition-all"
                                            >
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                                    {material.title}
                                                </h3>
                                                {material.description && (
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                                        {material.description}
                                                    </p>
                                                )}
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {material.type && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {material.type}
                                                        </Badge>
                                                    )}
                                                    {material.downloadCount > 0 && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {material.downloadCount} downloads
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    {user ? (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleAction(material)}
                                                            >
                                                                <Eye className="h-4 w-4 mr-1" />
                                                                View
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleDownloadMaterial(material)}
                                                                className={isOutOfCredits ? "bg-amber-600 hover:bg-amber-700" : "bg-blue-600 hover:bg-blue-700"}
                                                            >
                                                                {isOutOfCredits ? (
                                                                    <>
                                                                        <Lock className="h-4 w-4 mr-1" />
                                                                        Needs credits
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Download className="h-4 w-4 mr-1" />
                                                                        Download
                                                                    </>
                                                                )}
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleAction(material)}
                                                            className="bg-blue-600 hover:bg-blue-700"
                                                        >
                                                            <Lock className="h-4 w-4 mr-1" />
                                                            Login to Access
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : searchQuery && !searching ? (
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-12 text-center">
                                    <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                        No results found
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        Try different keywords
                                    </p>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

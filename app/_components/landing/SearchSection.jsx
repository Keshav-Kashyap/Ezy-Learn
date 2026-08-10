"use client";

import { useState, useContext } from "react";
import { Search, Download, Eye, Lock, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserDetailContext } from "@/context/UserDetailContext";
import { consumeCreditAndDownload } from "@/lib/downloadHelper";

export default function SearchSection({ isSignedIn }) {
    const { userDetail, setUserDetail } = useContext(UserDetailContext) || {};
    const isAdmin = userDetail?.role === 'admin';
    const isOutOfCredits = isSignedIn && !isAdmin && (userDetail?.credits ?? 0) <= 0;
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            toast.error("Please enter a search query");
            return;
        }

        setLoading(true);
        setHasSearched(true);

        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();

            if (data.success) {
                setSearchResults(data.results || []);
            } else {
                toast.error(data.error || "Search failed");
                setSearchResults([]);
            }
        } catch (error) {
            console.error("Search error:", error);
            toast.error("Failed to search");
            setSearchResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleAction = () => {
        if (!isSignedIn) {
            toast.error("Please login to download or view materials");
            window.location.href = '/sign-in';
        }
    };

    return (
        <section id="search" className="py-20 bg-gradient-to-b from-gray-50 to-white dark:from-[rgb(38,38,36)] dark:to-[rgb(28,28,26)]">
            <div className="container mx-auto px-4 max-w-6xl">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-block p-3 bg-blue-100 dark:bg-blue-900/20 rounded-2xl mb-4">
                        <Search className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                        Search Study Materials
                    </h2>
                    <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Find notes, PDFs, and study resources across all courses
                    </p>
                </div>

                {/* Search Bar */}
                <div className="mb-12 max-w-3xl mx-auto">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Search by title, subject, or course..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="pl-12 h-14 text-base bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                            />
                        </div>
                        <Button
                            onClick={handleSearch}
                            disabled={loading}
                            className="h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                        >
                            {loading ? "Searching..." : "Search"}
                        </Button>
                    </div>
                </div>

                {/* Login Notice for Non-logged Users */}
                {!isSignedIn && hasSearched && (
                    <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl">
                        <div className="flex items-center gap-3">
                            <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                You can browse materials, but{" "}
                                <a href="/sign-in" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                                    login
                                </a>
                                {" "}is required to view or download them.
                            </p>
                        </div>
                    </div>
                )}

                {/* Results */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">Searching...</p>
                    </div>
                ) : hasSearched ? (
                    <div>
                        {/* Results Count */}
                        <div className="mb-6">
                            <p className="text-lg text-gray-700 dark:text-gray-300">
                                Found <span className="font-bold text-blue-600">{searchResults.length}</span> results
                                {searchQuery && ` for "${searchQuery}"`}
                            </p>
                        </div>

                        {/* Results Grid */}
                        {searchResults.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {searchResults.map((material) => (
                                    <div
                                        key={material.id}
                                        className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2">
                                                    {material.title}
                                                </h3>
                                            </div>
                                        </div>

                                        {material.description && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                                                {material.description}
                                            </p>
                                        )}

                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {material.subjectName && (
                                                <Badge variant="outline" className="text-xs border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
                                                    {material.subjectName}
                                                </Badge>
                                            )}
                                            {material.category && (
                                                <Badge variant="outline" className="text-xs border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300">
                                                    {material.category.toUpperCase()}
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            {isSignedIn ? (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => window.open(material.fileUrl, '_blank')}
                                                        className="flex-1"
                                                    >
                                                        <Eye className="h-4 w-4 mr-1" />
                                                        View
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => consumeCreditAndDownload({
                                                            fileUrl: material.fileUrl,
                                                            fileName: material.title,
                                                            fileType: material.type,
                                                            userDetail,
                                                            setUserDetail,
                                                        })}
                                                        className={`flex-1 ${isOutOfCredits ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'}`}
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
                                                    onClick={handleAction}
                                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                                >
                                                    <Lock className="h-4 w-4 mr-2" />
                                                    Login to Access
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700">
                                <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                    No results found
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Try different keywords or check your spelling
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700">
                        <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            Start Your Search
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Enter keywords to find study materials across all courses
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}

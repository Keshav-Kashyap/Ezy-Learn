"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    GraduationCap,
    BookOpen,
    User,
    Sparkles,
    ArrowRight,
    ArrowLeft,
    Loader2,
    CheckCircle2
} from "lucide-react";

export default function CreateProfilePage() {
    const router = useRouter();
    const { user, isLoaded } = useUser();

    // Form states
    const [currentStep, setCurrentStep] = useState(1);
    const [name, setName] = useState("");
    const [course, setCourse] = useState("");
    const [semester, setSemester] = useState("");
    const [coursesList, setCoursesList] = useState([]);
    const [availableSemesters, setAvailableSemesters] = useState([]);
    const [loadingSemesters, setLoadingSemesters] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetchingInitial, setFetchingInitial] = useState(true);

    const isOtherCourse = course === "Other" || course === "Others";
    const totalSteps = isOtherCourse ? 2 : 3;

    useEffect(() => {
        if (!isLoaded) return;

        const checkExistingProfile = async () => {
            try {
                const res = await axios.get("/api/user-profile");
                if (res.data.success) {
                    if (res.data.user?.name) {
                        setName(res.data.user.name);
                    } else if (user) {
                        const googleName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
                        setName(googleName || user.username || "");
                    }

                    if (res.data.exists && res.data.profile) {
                        setCourse(res.data.profile.course || "");
                        setSemester(res.data.profile.semester || "");
                        router.push("/dashboard");
                        return;
                    }
                }
            } catch (error) {
                console.error("Error fetching initial user profile:", error);
                if (user) {
                    const googleName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
                    setName(googleName || user.username || "");
                }
            } finally {
                setFetchingInitial(false);
            }
        };

        const fetchCourses = async () => {
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

                const combined = Array.from(new Set([...dynamicCategories, ...availableCourses, "Other"]));
                setCoursesList(combined);
            } catch (err) {
                console.error("Error fetching dynamic DB courses:", err);
            }
        };

        checkExistingProfile();
        fetchCourses();
    }, [isLoaded, user]);

    // Fetch semesters dynamically when a course is selected
    useEffect(() => {
        if (!course || course === "Other" || course === "Others") {
            setAvailableSemesters([]);
            setSemester("");
            return;
        }

        const fetchSemestersForCourse = async () => {
            setLoadingSemesters(true);
            try {
                const res = await axios.get(`/api/semesters?course=${encodeURIComponent(course)}`);
                if (res.data.success && res.data.semesters?.length > 0) {
                    setAvailableSemesters(res.data.semesters);
                } else {
                    setAvailableSemesters([]);
                }
            } catch (err) {
                console.error("Error fetching semesters for course:", err);
                setAvailableSemesters([]);
            } finally {
                setLoadingSemesters(false);
            }
        };

        fetchSemestersForCourse();
    }, [course]);

    // Core Submit Handler
    const submitProfileData = async (selectedCourse, selectedSemester) => {
        if (!name.trim()) {
            toast.error("Please enter your name");
            setCurrentStep(1);
            return;
        }

        if (!selectedCourse) {
            toast.error("Please select your course/degree");
            setCurrentStep(2);
            return;
        }

        const isOther = selectedCourse === "Other" || selectedCourse === "Others";
        const finalSemester = isOther ? "N/A" : selectedSemester;

        if (!isOther && !finalSemester) {
            toast.error("Please select your Semester");
            setCurrentStep(3);
            return;
        }

        setLoading(true);

        try {
            const res = await axios.post("/api/user-profile", {
                name: name.trim(),
                course: selectedCourse,
                semester: finalSemester
            });

            if (res.data.success) {
                toast.success("Profile setup complete! Welcome to EzyStudy.");
                setTimeout(() => {
                    router.push("/dashboard");
                }, 600);
            } else {
                toast.error(res.data.error || "Failed to save profile");
            }
        } catch (error) {
            console.error("Error submitting profile:", error);
            toast.error(error.response?.data?.error || "Failed to create profile. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Step Navigation Handlers
    const handleNextStep1 = (e) => {
        e?.preventDefault();
        if (!name.trim()) {
            toast.error("Please enter your name to proceed");
            return;
        }
        setCurrentStep(2);
    };

    const handleNextStep2 = (e) => {
        e?.preventDefault();
        if (!course) {
            toast.error("Please select your course/degree");
            return;
        }

        if (course === "Other" || course === "Others") {
            submitProfileData(course, "N/A");
        } else {
            setCurrentStep(3);
        }
    };

    const handleFinalSubmit = (e) => {
        e?.preventDefault();
        submitProfileData(course, semester);
    };

    if (!isLoaded || fetchingInitial) {
        return (
            <div
                className="min-h-screen w-full flex flex-col items-center justify-center text-white p-4"
                style={{ backgroundColor: "rgb(38, 38, 36)" }}
            >
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-[rgb(50,50,47)] border border-[rgb(65,65,60)] animate-pulse flex items-center justify-center">
                        <GraduationCap className="w-7 h-7 text-blue-400" />
                    </div>
                    <p className="text-xs font-medium text-slate-400 animate-pulse">
                        Loading your profile...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen w-full flex flex-col items-center justify-center text-slate-100 p-4 sm:p-6 lg:p-8 relative selection:bg-blue-600 selection:text-white"
            style={{ backgroundColor: "rgb(38, 38, 36)" }}
        >
            <div className="w-full max-w-md relative z-10">

                {/* Header Title */}
                <div className="text-center space-y-2 mb-6">
                    <h1 className="text-2xl font-bold tracking-tight text-white">
                        Create Profile
                    </h1>

                    <p className="text-xs text-slate-400">
                        Step {Math.min(currentStep, totalSteps)} of {totalSteps}
                    </p>
                </div>

                {/* Step Progress Bar */}
                <div className="w-full bg-[rgb(50,50,47)] h-1.5 rounded-full mb-6 overflow-hidden border border-[rgb(60,60,55)]">
                    <div
                        className="bg-blue-500 h-full transition-all duration-300 ease-out rounded-full"
                        style={{ width: `${(Math.min(currentStep, totalSteps) / totalSteps) * 100}%` }}
                    />
                </div>

                {/* Form Slide Card */}
                <div className="bg-[rgb(48,48,45)] border border-[rgb(65,65,60)] rounded-2xl p-6 shadow-xl space-y-6">

                    {/* SLIDE 1: NAME INPUT */}
                    {currentStep === 1 && (
                        <form onSubmit={handleNextStep1} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col items-center">
                            <div className="space-y-2 w-full text-center">
                                <Label htmlFor="name" className="text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 w-full text-center">
                                    <User className="w-4 h-4 text-blue-400" />
                                    <span>What is your name?</span>
                                </Label>

                                <div className="relative w-full">
                                    <Input
                                        id="name"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Enter your name"
                                        className="h-11 bg-[rgb(32,32,30)] border-[rgb(65,65,60)] text-white placeholder:text-slate-500 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-center px-10"
                                        autoFocus
                                        required
                                    />
                                    {user?.imageUrl && (
                                        <img
                                            src={user.imageUrl}
                                            alt="Google Avatar"
                                            className="w-6 h-6 rounded-full absolute right-3 top-1/2 -translate-y-1/2 border border-slate-600 object-cover"
                                        />
                                    )}
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md mt-4"
                            >
                                <span>Next</span>
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </form>
                    )}

                    {/* SLIDE 2: COURSE SELECT */}
                    {currentStep === 2 && (
                        <form onSubmit={handleNextStep2} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col items-center">
                            <div className="space-y-2 w-full text-center flex flex-col gap-3 justify-center items-center">
                                <Label htmlFor="course" className="text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 w-full text-center">
                                    <GraduationCap className="w-4 h-4 text-blue-400" />
                                    <span>Select your Course / Degree</span>
                                </Label>

                                <Select value={course} onValueChange={(val) => setCourse(val)}>
                                    <SelectTrigger className="h-11 bg-[rgb(32,32,30)] border-[rgb(65,65,60)] px-10 text-white rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 text-center flex justify-center items-center [&>span]:w-full [&>span]:text-center">
                                        <SelectValue placeholder="Choose Degree " />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[rgb(38,38,36)] border-[rgb(65,65,60)] text-white rounded-xl shadow-xl">
                                        {coursesList.map((c) => (
                                            <SelectItem key={c} value={c} className="text-xs  sm:text-sm focus:bg-blue-600 focus:text-white cursor-pointer py-2.5 text-center justify-center flex items-center">
                                                {c}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-3 pt-2 w-full">
                                <Button
                                    type="button"
                                    onClick={() => setCurrentStep(1)}
                                    disabled={loading}
                                    variant="outline"
                                    className="h-11 px-4 border-[rgb(65,65,60)] bg-transparent hover:bg-[rgb(55,55,52)] text-slate-300 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                    <span>Back</span>
                                </Button>

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 h-11 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Completing...</span>
                                        </>
                                    ) : isOtherCourse ? (
                                        <>
                                            <span>Complete Profile</span>
                                            <CheckCircle2 className="w-4 h-4" />
                                        </>
                                    ) : (
                                        <>
                                            <span>Next</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    )}

                    {/* SLIDE 3: SEMESTER SELECT */}
                    {currentStep === 3 && !isOtherCourse && (
                        <form onSubmit={handleFinalSubmit} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col items-center">
                            <div className="space-y-2 w-full text-center flex flex-col justify-center items-center gap-3">
                                <Label htmlFor="semester" className="text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 w-full text-center">
                                    <BookOpen className="w-4 h-4 text-blue-400" />
                                    <span>Select your Current Semester</span>
                                </Label>

                                <Select value={semester} onValueChange={(val) => setSemester(val)} disabled={loadingSemesters}>
                                    <SelectTrigger className="h-11 bg-[rgb(32,32,30)] border-[rgb(65,65,60)] text-white rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 text-center px-8 flex justify-center items-center [&>span]:w-full [&>span]:text-center">
                                        <SelectValue placeholder={loadingSemesters ? "Loading semesters..." : "Choose Semester"} />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[rgb(38,38,36)] border-[rgb(65,65,60)] text-white rounded-xl shadow-xl">
                                        {availableSemesters.map((sem) => (
                                            <SelectItem key={sem} value={sem} className="text-xs sm:text-sm focus:bg-blue-600 focus:text-white cursor-pointer py-2.5 text-center justify-center flex items-center">
                                                {sem}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-3 pt-2 w-full">
                                <Button
                                    type="button"
                                    onClick={() => setCurrentStep(2)}
                                    disabled={loading}
                                    variant="outline"
                                    className="h-11 px-4 border-[rgb(65,65,60)] bg-transparent hover:bg-[rgb(55,55,52)] text-slate-300 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                    <span>Back</span>
                                </Button>

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 h-11 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Completing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Complete Profile</span>
                                            <CheckCircle2 className="w-4 h-4" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    )}

                </div>

                {/* Step Dots */}
                <div className="flex items-center justify-center gap-2 mt-6">
                    {Array.from({ length: totalSteps }).map((_, idx) => {
                        const stepNum = idx + 1;
                        return (
                            <button
                                key={stepNum}
                                type="button"
                                onClick={() => {
                                    if (stepNum === 1) setCurrentStep(1);
                                    else if (stepNum === 2 && name.trim()) setCurrentStep(2);
                                    else if (stepNum === 3 && name.trim() && course && !isOtherCourse) setCurrentStep(3);
                                }}
                                className={`w-2.5 h-2.5 rounded-full transition-all ${
                                    currentStep === stepNum
                                        ? "bg-blue-500 w-6"
                                        : "bg-[rgb(65,65,60)] hover:bg-[rgb(80,80,75)]"
                                }`}
                            />
                        );
                    })}
                </div>

            </div>
        </div>
    );
}

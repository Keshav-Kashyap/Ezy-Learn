"use client";

import { motion } from "motion/react";
import Link from "next/link";
import Image from "next/image";
import { GraduationCap, ArrowRight, BookOpen, FileText, Users } from 'lucide-react';
import CourseSkeleton from './skeletons/CourseSkeleton';

export default function CoursesSection({ courses, loading }) {
    const courseImages = {
        'MCA': 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=600&h=400&fit=crop',
        'BCA': 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=400&fit=crop',
        'BTECH': 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=400&fit=crop',
        'BTech': 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=400&fit=crop'
    };

    const defaultCourses = [
        { title: 'MCA', desc: 'Master of Computer Applications', img: courseImages.MCA, semesters: 4 },
        { title: 'BCA', desc: 'Bachelor of Computer Applications', img: courseImages.BCA, semesters: 6 },
        { title: 'BTech', desc: 'Bachelor of Technology', img: courseImages.BTECH, semesters: 8 }
    ];

    const displayCourses = courses && courses.length > 0 ? courses : defaultCourses;
    const showDefaultCourses = !courses || courses.length === 0;

    return (
        <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12">
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-center gap-3">
                        <GraduationCap className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                        Popular Courses
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-400">
                        Explore our most enrolled courses
                    </p>
                </motion.div>

                {loading ? (
                    <CourseSkeleton count={3} wrapperClassName="grid md:grid-cols-3 gap-8" />
                ) : (
                    <div className="grid md:grid-cols-3 gap-8">
                        {displayCourses.map((course, i) => {
                            const courseImage = showDefaultCourses
                                ? course.img
                                : (course.image || courseImages[course.category] || courseImages[course.code] || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop');

                            return (
                                <motion.div
                                    key={course.id || i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700">
                                    <div className="h-48 relative overflow-hidden">
                                        <Image
                                            src={courseImage}
                                            alt={course.title}
                                            width={600}
                                            height={400}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextElementSibling.style.display = 'flex';
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 hidden items-center justify-center">
                                            <BookOpen className="w-20 h-20 text-white/30" />
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                        <div className="absolute top-4 right-4">
                                            <span className="px-3 py-1 bg-white/90 text-gray-900 rounded-full text-sm font-bold backdrop-blur-sm">
                                                {course.semesters || 0} Semesters
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {course.title}
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 text-sm">
                                            {course.description || course.desc || 'Comprehensive course with complete study materials'}
                                        </p>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                                <FileText className="w-4 h-4" />
                                                <span className="text-sm font-semibold">{course.totalMaterials || course.documents || '100+'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                                <Users className="w-4 h-4" />
                                                <span className="text-sm font-semibold">{course.students || '500'}+</span>
                                            </div>
                                        </div>
                                        <Link href={`/library/${showDefaultCourses ? course.title.toUpperCase() : (course.category || course.code)}`}>
                                            <button className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all duration-300 transform group-hover:scale-105 flex items-center justify-center gap-2">
                                                Explore Course
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </Link>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* View All Courses Button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mt-12">
                    <Link href="/allCourses">
                        <button className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl flex items-center justify-center gap-2 mx-auto">
                            View All Courses
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}

"use client";

import { motion } from "motion/react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen, Award } from 'lucide-react';

export default function HeroSection({ onDashboard }) {
    return (
        <section className="relative overflow-hidden pt-20 pb-32 px-5 bg-white dark:bg-[rgb(38,38,36)]">
            {/* Gradient Blobs */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
            </div>

            <div className="container mx-auto px-4">
                <div className="flex flex-col lg:flex-row items-center gap-12">
                    {/* Left Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="flex-1 text-center lg:text-left">
                     

                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                            {"Ezy Learn".split(" ").map((word, i) => (
                                <motion.span
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: i * 0.1 }}
                                    className="inline-block mr-4">
                                    {word}
                                </motion.span>
                            ))}
                            <br />
                            <span className="text-blue-600 dark:text-blue-400">
                                Easy Study, Smart Success
                            </span>
                        </h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto lg:mx-0">
                            Access thousands of study materials, download notes, and ace your exams with our comprehensive learning platform.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.5 }}
                            className="flex flex-wrap gap-4 justify-center lg:justify-start">
                            <button
                                onClick={onDashboard}
                                className="group px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center gap-2">
                                Get Started Free
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <Link href="/allCourses">
                                <button className="px-8 py-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105">
                                    Browse Library
                                </button>
                            </Link>
                        </motion.div>

                        {/* Stats */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.7 }}
                            className="mt-12 flex flex-wrap gap-8 justify-center lg:justify-start">
                            <div className="text-center lg:text-left">
                                <div className="text-3xl font-bold text-gray-900 dark:text-white">10K+</div>
                                <div className="text-gray-600 dark:text-gray-400">Students</div>
                            </div>
                            <div className="text-center lg:text-left">
                                <div className="text-3xl font-bold text-gray-900 dark:text-white">500+</div>
                                <div className="text-gray-600 dark:text-gray-400">Study Materials</div>
                            </div>
                            <div className="text-center lg:text-left">
                                <div className="text-3xl font-bold text-gray-900 dark:text-white">50+</div>
                                <div className="text-gray-600 dark:text-gray-400">Subjects</div>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Right Image */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="flex-1 relative">
                        <div className="relative w-full max-w-lg mx-auto">
                            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl blur-2xl opacity-20" />
                            <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                                <Image
                                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop"
                                    alt="Students studying"
                                    width={800}
                                    height={600}
                                    className="w-full h-auto"
                                    priority
                                />
                            </div>
                            {/* Floating Cards */}
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 3, repeat: Infinity }}
                                className="absolute -left-4 top-1/4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg">
                                <BookOpen className="w-8 h-8 text-blue-600" />
                            </motion.div>
                            <motion.div
                                animate={{ y: [0, 10, 0] }}
                                transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                                className="absolute -right-4 bottom-1/4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg">
                                <Award className="w-8 h-8 text-purple-600" />
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Curved Separator */}
            <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
                <svg className="relative block w-full h-[120px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                    <path d="M0,0 Q600,150 1200,0 L1200,120 L0,120 Z" className="fill-gray-50 dark:fill-gray-900/50"></path>
                </svg>
            </div>
        </section>
    );
}

import { db } from "@/config/db";
import { semestersTable, coursesTable } from "@/config/schema";
import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const course = searchParams.get('course');

        if (!course || course === 'Other' || course === 'Others') {
            return NextResponse.json({ success: true, semesters: [] });
        }

        const trimmedCourse = course.trim();

        // Query ALL semesters for this course category (active or inactive) from semestersTable
        const semesters = await db.select().from(semestersTable)
            .where(sql`lower(${semestersTable.category}) = lower(${trimmedCourse})`);

        // If semesters found in semestersTable, sort them numerically and return
        if (semesters.length > 0) {
            const getNumber = (name) => {
                const match = name?.match(/\d+/);
                return match ? parseInt(match[0], 10) : 0;
            };

            const sortedSemesters = semesters.sort((a, b) => getNumber(a.name) - getNumber(b.name));
            const semesterNames = sortedSemesters.map(s => s.name);

            return NextResponse.json({
                success: true,
                semesters: semesterNames
            });
        }

        // Fallback: Check course duration from coursesTable
        const courses = await db.select().from(coursesTable)
            .where(sql`lower(${coursesTable.category}) = lower(${trimmedCourse})`);

        let semCount = 6;
        if (courses.length > 0 && courses[0].duration) {
            semCount = courses[0].duration * 2; // 2 years = 4 sem, 3 years = 6 sem, 4 years = 8 sem
        } else if (trimmedCourse.toLowerCase() === 'mca') {
            semCount = 4;
        } else if (trimmedCourse.toLowerCase() === 'btech' || trimmedCourse.toLowerCase() === 'b.tech') {
            semCount = 8;
        }

        const fallbackSemesters = Array.from({ length: semCount }, (_, i) => `Semester ${i + 1}`);

        return NextResponse.json({
            success: true,
            semesters: fallbackSemesters
        });

    } catch (error) {
        console.error("Error fetching semesters for course:", error);
        return NextResponse.json({
            success: false,
            error: error.message || "Failed to fetch semesters"
        }, { status: 500 });
    }
}

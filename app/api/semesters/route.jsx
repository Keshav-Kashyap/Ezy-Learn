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
            return NextResponse.json({ success: true, count: 0 });
        }

        const trimmedCourse = course.trim();

        // Query count of semesters for this course category from semestersTable
        const semesters = await db.select({ id: semestersTable.id }).from(semestersTable)
            .where(sql`lower(${semestersTable.category}) = lower(${trimmedCourse})`);

        if (semesters.length > 0) {
            return NextResponse.json({
                success: true,
                count: semesters.length
            });
        }

        // Fallback: Check course duration from coursesTable
        const courses = await db.select({ duration: coursesTable.duration }).from(coursesTable)
            .where(sql`lower(${coursesTable.category}) = lower(${trimmedCourse})`);

        let semCount = 6;
        if (courses.length > 0 && courses[0].duration) {
            semCount = courses[0].duration * 2; // 2 years = 4 sem, 3 years = 6 sem, 4 years = 8 sem
        } else if (trimmedCourse.toLowerCase() === 'mca') {
            semCount = 4;
        } else if (trimmedCourse.toLowerCase() === 'btech' || trimmedCourse.toLowerCase() === 'b.tech') {
            semCount = 8;
        }

        return NextResponse.json({
            success: true,
            count: semCount
        });

    } catch (error) {
        console.error("Error fetching semesters count for course:", error);
        return NextResponse.json({
            success: false,
            error: error.message || "Failed to fetch semesters count"
        }, { status: 500 });
    }
}

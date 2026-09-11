import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { coursesTable } from "@/config/schema";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET() {
    try {
        const dbCourses = await db.select({
            category: coursesTable.category,
            title: coursesTable.title
        }).from(coursesTable);

        const availableCourses = Array.from(
            new Set(dbCourses.map(c => c.category || c.title).filter(Boolean))
        );

        return NextResponse.json({
            success: true,
            courses: availableCourses
        });
    } catch (error) {
        console.error("Error fetching available courses:", error);
        return NextResponse.json({
            success: false,
            error: error.message || "Failed to fetch available courses"
        }, { status: 500 });
    }
}

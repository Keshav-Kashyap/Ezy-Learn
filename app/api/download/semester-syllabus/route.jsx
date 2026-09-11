import { db } from "@/config/db";
import { syllabusTable } from "@/config/schema";
import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";

export async function POST(request) {
    try {
        const { category, semesterName } = await request.json();

        console.log("📚 Fetching syllabus for:", { category, semesterName });

        if (!category || !semesterName) {
            return NextResponse.json(
                { success: false, error: "Category and semester name required" },
                { status: 400 }
            );
        }

        // Extract year from semester name
        // "Semester 1" or "Semester 2" -> Year 1
        // "Semester 3" or "Semester 4" -> Year 2
        const semesterNumber = parseInt(semesterName.match(/\d+/)?.[0] || "1");
        const year = Math.ceil(semesterNumber / 2);

        console.log(`📖 Semester ${semesterNumber} -> Year ${year}`);

        // Fetch syllabus for this category and year
        const syllabi = await db
            .select()
            .from(syllabusTable)
            .where(
                and(
                    eq(syllabusTable.category, category),
                    eq(syllabusTable.year, year),
                    eq(syllabusTable.isActive, true)
                )
            );

        console.log(` Found ${syllabi.length} syllabus files`);

        if (syllabi.length === 0) {
            return NextResponse.json({
                success: false,
                error: "No syllabus found for this semester"
            });
        }

        return NextResponse.json({
            success: true,
            syllabi: syllabi,
            year: year
        });
    } catch (error) {
        console.error("❌ Error fetching semester syllabus:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch syllabus",
                message: error.message
            },
            { status: 500 }
        );
    }
}

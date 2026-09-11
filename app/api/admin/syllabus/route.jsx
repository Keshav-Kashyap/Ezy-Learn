import { db } from "@/config/db";
import { syllabusTable } from "@/config/schema";
import { NextResponse } from "next/server";
import { eq, desc, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

// GET - Fetch all syllabi or filter by category/year
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const year = searchParams.get('year');

        console.log("📚 Fetching syllabi...", { category, year });

        // Build where conditions
        const conditions = [eq(syllabusTable.isActive, true)];

        if (category) {
            conditions.push(eq(syllabusTable.category, category));
        }
        if (year) {
            conditions.push(eq(syllabusTable.year, parseInt(year)));
        }

        const syllabi = await db
            .select()
            .from(syllabusTable)
            .where(and(...conditions))
            .orderBy(desc(syllabusTable.createdAt));

        console.log(` Found ${syllabi.length} syllabi for category: ${category}`);

        return NextResponse.json({
            success: true,
            syllabi: syllabi,
            count: syllabi.length
        });
    } catch (error) {
        console.error("❌ Error fetching syllabi:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch syllabi",
                message: error.message
            },
            { status: 500 }
        );
    }
}

// POST - Upload new syllabus (Admin only)
export async function POST(request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { category, year, title, description, fileUrl, imageUrl } = body;

        console.log("📤 Uploading syllabus:", { category, year, title });

        // Validate required fields
        if (!category || !year || !title || !fileUrl) {
            return NextResponse.json(
                { success: false, error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Insert into database
        const [newSyllabus] = await db.insert(syllabusTable).values({
            category,
            year: parseInt(year),
            title,
            description: description || null,
            fileUrl,
            imageUrl: imageUrl || null,
            uploadedBy: userId,
            isActive: true
        }).returning();

        console.log(" Syllabus uploaded successfully:", newSyllabus.id);

        return NextResponse.json({
            success: true,
            syllabus: newSyllabus,
            message: "Syllabus uploaded successfully"
        });
    } catch (error) {
        console.error("❌ Error uploading syllabus:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to upload syllabus",
                message: error.message
            },
            { status: 500 }
        );
    }
}

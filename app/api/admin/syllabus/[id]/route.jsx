import { db } from "@/config/db";
import { syllabusTable } from "@/config/schema";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

// DELETE - Delete a syllabus (Admin only)
export async function DELETE(request, { params }) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await params;
        console.log("🗑️ Deleting syllabus:", id);

        // Soft delete - set isActive to false
        const [deletedSyllabus] = await db
            .update(syllabusTable)
            .set({ isActive: false })
            .where(eq(syllabusTable.id, parseInt(id)))
            .returning();

        if (!deletedSyllabus) {
            return NextResponse.json(
                { success: false, error: "Syllabus not found" },
                { status: 404 }
            );
        }

        console.log(" Syllabus deleted successfully");

        return NextResponse.json({
            success: true,
            message: "Syllabus deleted successfully"
        });
    } catch (error) {
        console.error("❌ Error deleting syllabus:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to delete syllabus",
                message: error.message
            },
            { status: 500 }
        );
    }
}

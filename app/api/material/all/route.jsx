import { db } from "@/config/db";
import { studyMaterialsTable, materialSubjectMappingTable, subjectsTable } from "@/config/schema";
import { NextResponse } from "next/server";
import { eq, desc, sql, inArray } from "drizzle-orm";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '10')));
        const offset = (page - 1) * limit;

        // Get total count of active notes
        const [countResult] = await db
            .select({ count: sql`count(*)` })
            .from(studyMaterialsTable)
            .where(eq(studyMaterialsTable.isActive, true));

        const totalCount = Number(countResult?.count || 0);
        const totalPages = Math.ceil(totalCount / limit);

        // Fetch distinct note IDs for the current page
        const pageMaterialIds = await db
            .select({ id: studyMaterialsTable.id })
            .from(studyMaterialsTable)
            .where(eq(studyMaterialsTable.isActive, true))
            .orderBy(desc(studyMaterialsTable.createdAt))
            .limit(limit)
            .offset(offset);

        if (pageMaterialIds.length === 0) {
            return NextResponse.json({
                success: true,
                notes: [],
                count: 0,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount,
                    hasNextPage: false
                }
            });
        }

        const ids = pageMaterialIds.map(m => m.id);

        // Fetch full notes with subject mappings for the paginated IDs
        const notesWithSubjects = await db
            .select({
                id: studyMaterialsTable.id,
                title: studyMaterialsTable.title,
                description: studyMaterialsTable.description,
                fileUrl: studyMaterialsTable.fileUrl,
                downloadCount: studyMaterialsTable.downloadCount,
                likes: studyMaterialsTable.likes,
                type: studyMaterialsTable.type,
                imageUrl: studyMaterialsTable.imageUrl,
                tags: studyMaterialsTable.tags,
                isPopular: studyMaterialsTable.isPopular,
                createdAt: studyMaterialsTable.createdAt,
                subjectId: subjectsTable.id,
                subjectName: subjectsTable.name,
            })
            .from(studyMaterialsTable)
            .leftJoin(
                materialSubjectMappingTable,
                eq(studyMaterialsTable.id, materialSubjectMappingTable.materialId)
            )
            .leftJoin(
                subjectsTable,
                eq(materialSubjectMappingTable.subjectId, subjectsTable.id)
            )
            .where(inArray(studyMaterialsTable.id, ids))
            .orderBy(desc(studyMaterialsTable.createdAt));

        // Preserve order of IDs while grouping materials with their mapped subjects
        const notesMap = new Map();
        ids.forEach(id => {
            notesMap.set(id, null);
        });

        notesWithSubjects.forEach(row => {
            if (!notesMap.get(row.id)) {
                notesMap.set(row.id, {
                    id: row.id,
                    title: row.title,
                    description: row.description,
                    fileUrl: row.fileUrl,
                    downloadCount: row.downloadCount,
                    likes: row.likes,
                    type: row.type,
                    imageUrl: row.imageUrl,
                    tags: row.tags,
                    isPopular: row.isPopular,
                    createdAt: row.createdAt,
                    subjects: []
                });
            }
            if (row.subjectId) {
                notesMap.get(row.id).subjects.push({
                    id: row.subjectId,
                    name: row.subjectName
                });
            }
        });

        const notes = Array.from(notesMap.values()).filter(Boolean);

        return NextResponse.json({
            success: true,
            notes: notes,
            count: notes.length,
            pagination: {
                currentPage: page,
                totalPages,
                totalCount,
                hasNextPage: page < totalPages
            }
        });
    } catch (e) {
        console.error("Error fetching all notes:", e);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch all notes"
            },
            { status: 500 }
        );
    }
}

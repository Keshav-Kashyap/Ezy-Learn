import { db } from "@/config/db";
import { studyMaterialsTable, materialSubjectMappingTable, subjectsTable } from "@/config/schema";
import { NextResponse } from "next/server";
import { eq, desc, like, or, and } from "drizzle-orm";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = Math.max(1, Math.min(500, parseInt(searchParams.get('limit') || '100')));

        // Fetch notes tagged as 'popular' or marked with isPopular = true, sorted by likes & downloadCount
        let notesWithSubjects = await db
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
            .where(
                and(
                    eq(studyMaterialsTable.isActive, true),
                    or(
                        eq(studyMaterialsTable.isPopular, true),
                        like(studyMaterialsTable.tags, '%popular%')
                    )
                )
            )
            .orderBy(desc(studyMaterialsTable.likes), desc(studyMaterialsTable.downloadCount), desc(studyMaterialsTable.createdAt))
            .limit(limit);

        // Fallback: If no explicit popular notes found, fetch top notes ordered by likes & downloadCount
        if (notesWithSubjects.length === 0) {
            notesWithSubjects = await db
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
                .where(eq(studyMaterialsTable.isActive, true))
                .orderBy(desc(studyMaterialsTable.likes), desc(studyMaterialsTable.downloadCount), desc(studyMaterialsTable.createdAt))
                .limit(limit);
        }

        // Group materials with their mapped subjects
        const notesMap = new Map();
        notesWithSubjects.forEach(row => {
            if (!notesMap.has(row.id)) {
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

        const notes = Array.from(notesMap.values());

        return NextResponse.json({
            success: true,
            notes: notes,
            count: notes.length
        });
    } catch (e) {
        console.error("Error fetching popular notes:", e);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch popular notes"
            },
            { status: 500 }
        );
    }
}

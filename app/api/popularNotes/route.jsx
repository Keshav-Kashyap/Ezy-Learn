
import { db } from "@/config/db";
import { coursesTable, semestersTable, subjectsTable, studyMaterialsTable, materialSubjectMappingTable } from "@/config/schema";
import { NextResponse } from "next/server";
import { eq, desc, sql, like } from "drizzle-orm";

export async function GET(request) {
    try {
        // Get limit & all flag from query params
        const { searchParams } = new URL(request.url);
        const limit = Math.max(1, Math.min(500, parseInt(searchParams.get('limit') || '100')));
        const fetchAll = searchParams.get('all') === 'true' || searchParams.get('allNotes') === 'true';

        // Fetch notes with their subjects through mapping table
        let notesWithSubjects = [];

        if (!fetchAll) {
            // Fetch notes tagged as 'popular'
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
                .where(like(studyMaterialsTable.tags, '%popular%'))
                .orderBy(desc(studyMaterialsTable.downloadCount), desc(studyMaterialsTable.likes))
                .limit(limit);

            // Fallback for popular: if no notes tagged '%popular%', fetch top downloaded/liked notes
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
                    .orderBy(desc(studyMaterialsTable.downloadCount), desc(studyMaterialsTable.likes))
                    .limit(Math.min(limit, 10));
            }
        } else {
            // fetchAll === true: fetch ALL notes
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
                .orderBy(desc(studyMaterialsTable.createdAt), desc(studyMaterialsTable.downloadCount))
                .limit(limit);
        }

        // Group materials with their subjects
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

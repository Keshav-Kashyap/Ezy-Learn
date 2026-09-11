import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { studyMaterialsTable, materialSubjectMappingTable, subjectsTable, coursesTable } from "@/config/schema";
import { ilike, or, eq } from "drizzle-orm";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');

        console.log("Search API called with query:", query);

        if (!query || query.trim().length === 0) {
            return NextResponse.json({
                success: true,
                results: [],
                count: 0
            });
        }

        const rawQuery = query.trim();
        const tokens = rawQuery.toLowerCase().split(/\s+/).filter(t => t.length > 0);

        // Build token-based search conditions for flexible matching
        const searchConditions = [];
        const fullTerm = `%${rawQuery}%`;
        searchConditions.push(
            ilike(studyMaterialsTable.title, fullTerm),
            ilike(studyMaterialsTable.description, fullTerm),
            ilike(studyMaterialsTable.tags, fullTerm),
            ilike(subjectsTable.name, fullTerm),
            ilike(subjectsTable.code, fullTerm),
            ilike(coursesTable.title, fullTerm),
            ilike(coursesTable.category, fullTerm)
        );

        tokens.forEach(token => {
            const tokenTerm = `%${token}%`;
            searchConditions.push(
                ilike(studyMaterialsTable.title, tokenTerm),
                ilike(studyMaterialsTable.description, tokenTerm),
                ilike(studyMaterialsTable.tags, tokenTerm),
                ilike(subjectsTable.name, tokenTerm),
                ilike(subjectsTable.code, tokenTerm),
                ilike(coursesTable.title, tokenTerm),
                ilike(coursesTable.category, tokenTerm)
            );
        });

        // Search study materials joined with subjects & course information
        const rawResults = await db
            .select({
                id: studyMaterialsTable.id,
                title: studyMaterialsTable.title,
                description: studyMaterialsTable.description,
                type: studyMaterialsTable.type,
                fileUrl: studyMaterialsTable.fileUrl,
                imageUrl: studyMaterialsTable.imageUrl,
                downloadCount: studyMaterialsTable.downloadCount,
                likes: studyMaterialsTable.likes,
                tags: studyMaterialsTable.tags,
                isActive: studyMaterialsTable.isActive,
                createdAt: studyMaterialsTable.createdAt,
                subjectId: subjectsTable.id,
                subjectName: subjectsTable.name,
                subjectCode: subjectsTable.code,
                semesterName: subjectsTable.semesterName,
                courseCategory: subjectsTable.category,
                courseTitle: coursesTable.title,
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
            .leftJoin(
                coursesTable,
                eq(subjectsTable.category, coursesTable.category)
            )
            .where(or(...searchConditions))
            .limit(150);

        // Deduplicate materials by ID while combining subject/course info
        const materialsMap = new Map();
        rawResults.forEach(row => {
            if (row.isActive === false) return;

            if (!materialsMap.has(row.id)) {
                materialsMap.set(row.id, {
                    id: row.id,
                    title: row.title,
                    description: row.description,
                    type: row.type || 'PDF',
                    fileUrl: row.fileUrl,
                    imageUrl: row.imageUrl,
                    downloadCount: row.downloadCount || 0,
                    likes: row.likes || 0,
                    tags: row.tags,
                    createdAt: row.createdAt,
                    parentSubject: row.subjectName || null,
                    parentSemester: row.semesterName || null,
                    parentCourse: row.courseTitle || row.courseCategory || null,
                    subjects: []
                });
            }

            if (row.subjectId) {
                const current = materialsMap.get(row.id);
                if (!current.subjects.some(s => s.id === row.subjectId)) {
                    current.subjects.push({
                        id: row.subjectId,
                        name: row.subjectName,
                        code: row.subjectCode,
                        semester: row.semesterName,
                        course: row.courseTitle || row.courseCategory
                    });
                }
            }
        });

        const queryLower = rawQuery.toLowerCase();

        // Calculate search priority score & format display title
        const sortedMaterials = Array.from(materialsMap.values()).map(item => {
            let score = 0;
            const titleLower = (item.title || '').toLowerCase();
            const subjectLower = (item.parentSubject || '').toLowerCase();
            const descLower = (item.description || '').toLowerCase();
            const tagsLower = (item.tags || '').toLowerCase();
            const courseLower = (item.parentCourse || '').toLowerCase();

            // Full phrase bonus
            if (titleLower.includes(queryLower)) score += 5000;
            if (subjectLower.includes(queryLower)) score += 3000;

            // Token-by-token scoring with left-to-right word position weighting
            tokens.forEach((token, index) => {
                // First word gets highest weight multiplier (10), second gets 7, etc.
                const positionWeight = Math.max(1, 10 - index * 3);

                // Priority 1: Match in Note Title
                if (titleLower.includes(token)) {
                    score += 1000 * positionWeight;
                    if (titleLower.startsWith(token)) score += 500 * positionWeight;
                }

                // Priority 2: Match in Subject Name
                if (subjectLower.includes(token)) {
                    score += 600 * positionWeight;
                    if (subjectLower.startsWith(token)) score += 300 * positionWeight;
                }

                // Priority 3: Match in Course Title / Category
                if (courseLower.includes(token)) {
                    score += 300 * positionWeight;
                }

                // Priority 4: Match in Description or Tags
                if (descLower.includes(token)) score += 50 * positionWeight;
                if (tagsLower.includes(token)) score += 30 * positionWeight;
            });

            // Format displayTitle: Always format as "Subject Name : Note Title" when subject exists
            let displayTitle = item.title;
            if (item.parentSubject) {
                const subName = item.parentSubject.trim();
                // Check if title already starts with "Subject :" or "Subject -"
                if (item.title.toLowerCase().startsWith(subName.toLowerCase())) {
                    displayTitle = item.title;
                } else {
                    displayTitle = `${subName} : ${item.title}`;
                }
            }

            return {
                ...item,
                displayTitle,
                score
            };
        });

        // Filter valid matches (>0 score) and sort descending by score, then downloadCount
        const finalResults = sortedMaterials
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score || b.downloadCount - a.downloadCount);

        console.log("Found materials count:", finalResults.length);

        return NextResponse.json({
            success: true,
            results: finalResults,
            count: finalResults.length
        });

    } catch (error) {
        console.error("Search error:", error);
        return NextResponse.json({
            success: false,
            error: "Failed to search materials",
            details: error.message
        }, { status: 500 });
    }
}


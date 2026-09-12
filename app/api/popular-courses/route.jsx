import { db } from "@/config/db";
import { coursesTable, semestersTable, subjectsTable, studyMaterialsTable, materialSubjectMappingTable } from "@/config/schema";
import { NextResponse } from "next/server";
import { eq, sql, count, inArray } from "drizzle-orm";

export async function GET(request) {
    try {
        // Get limit from query params, default to 6
        const { searchParams } = new URL(request.url);
        const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '6')));

        console.log(" Fetching popular courses...");

        // Fetch courses with material count and student count
        const courses = await db
            .select({
                id: coursesTable.id,
                title: coursesTable.title,
                category: coursesTable.category,
                description: coursesTable.description,
                image: coursesTable.image,
                duration: coursesTable.duration,
                bgColor: coursesTable.bgColor,
                createdAt: coursesTable.createdAt,
            })
            .from(coursesTable)
            .limit(limit);

        console.log(`📚 Found ${courses.length} courses:`, courses.map(c => ({ title: c.title, category: c.category })));

        // For each course, get semester count and total materials
        const coursesWithStats = await Promise.all(
            courses.map(async (course) => {
                try {
                    console.log(`\n🔍 Processing course: ${course.title} (${course.category})`);

                    // Get semester count for this course category
                    const semesters = await db
                        .select()
                        .from(semestersTable)
                        .where(eq(semestersTable.category, course.category));

                    console.log(`   📅 Semesters found: ${semesters.length}`);

                    // Get all subjects for this course category
                    const subjects = await db
                        .select({ id: subjectsTable.id })
                        .from(subjectsTable)
                        .where(eq(subjectsTable.category, course.category));

                    console.log(`    Subjects found: ${subjects.length}`);

                    const subjectIds = subjects.map(s => s.id);
                    let totalMaterials = 0;

                    // Count materials through mapping table
                    if (subjectIds.length > 0) {
                        const [result] = await db
                            .select({ count: count() })
                            .from(materialSubjectMappingTable)
                            .where(inArray(materialSubjectMappingTable.subjectId, subjectIds));

                        totalMaterials = result?.count || 0;
                        console.log(`    Materials found: ${totalMaterials}`);
                    } else {
                        console.log(`    No subjects found for category: ${course.category}`);
                    }

                    const courseStats = {
                        ...course,
                        semesters: semesters.length,
                        totalMaterials: totalMaterials,
                        students: Math.floor(totalMaterials * 3.5) + Math.floor(Math.random() * 100), // Estimated students
                    };

                    console.log(`    Stats: ${semesters.length} semesters, ${totalMaterials} materials, ${courseStats.students} students`);

                    return courseStats;
                } catch (error) {
                    console.error(`❌ Error processing course ${course.title}:`, error);
                    return {
                        ...course,
                        semesters: 0,
                        totalMaterials: 0,
                        students: 0,
                    };
                }
            })
        );

        console.log(`\n📊 Total courses with stats: ${coursesWithStats.length}`);

        // Sort by total materials (most popular first)
        const popularCourses = coursesWithStats
            .sort((a, b) => b.totalMaterials - a.totalMaterials)
            .slice(0, 3); // Top 3 popular courses

        console.log(`\n🏆 Top 3 popular courses:`, popularCourses.map(c => ({
            title: c.title,
            materials: c.totalMaterials,
            students: c.students
        })));

        return NextResponse.json({
            success: true,
            courses: popularCourses,
        });
    } catch (error) {
        console.error("❌ ERROR fetching popular courses:", error);
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch popular courses",
                message: error.message,
                details: error.toString()
            },
            { status: 500 }
        );
    }
}

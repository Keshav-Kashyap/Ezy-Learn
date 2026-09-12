import { db } from "@/config/db";
import { coursesTable, semestersTable, subjectsTable, studyMaterialsTable } from "@/config/schema";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function POST() {
    try {
        console.log('🌱 Starting default data seeding...');

        // Default subjects data for different courses and semesters
        const defaultSubjects = {
            'MCA': {
                'Semester 1': [
                    { name: 'Computer Fundamentals', code: 'MCA101', description: 'Basic computer concepts and programming' },
                    { name: 'Programming in C', code: 'MCA102', description: 'C programming language fundamentals' },
                    { name: 'Mathematics for Computing', code: 'MCA103', description: 'Mathematical foundations for computer science' },
                    { name: 'Digital Electronics', code: 'MCA104', description: 'Digital logic and electronics basics' },
                    { name: 'Communication Skills', code: 'MCA105', description: 'Technical communication and soft skills' }
                ],
                'Semester 2': [
                    { name: 'Data Structures', code: 'MCA201', description: 'Linear and non-linear data structures' },
                    { name: 'Object Oriented Programming', code: 'MCA202', description: 'OOP concepts using Java/C++' },
                    { name: 'Database Management System', code: 'MCA203', description: 'Relational database concepts and SQL' },
                    { name: 'Computer Networks', code: 'MCA204', description: 'Network fundamentals and protocols' },
                    { name: 'Operating Systems', code: 'MCA205', description: 'OS concepts and system programming' }
                ]
            },
            'BCA': {
                'Semester 1': [
                    { name: 'Computer Fundamentals', code: 'BCA101', description: 'Introduction to computers and IT' },
                    { name: 'Programming Principles', code: 'BCA102', description: 'Basic programming concepts' },
                    { name: 'Mathematics-I', code: 'BCA103', description: 'Mathematical foundations' },
                    { name: 'Digital Computer Fundamentals', code: 'BCA104', description: 'Computer hardware and software' },
                    { name: 'English Communication', code: 'BCA105', description: 'Communication skills development' }
                ],
                'Semester 2': [
                    { name: 'Programming in C', code: 'BCA201', description: 'C programming language' },
                    { name: 'Mathematics-II', code: 'BCA202', description: 'Advanced mathematics for computing' },
                    { name: 'Computer Organization', code: 'BCA203', description: 'Computer architecture and organization' },
                    { name: 'Web Technology', code: 'BCA204', description: 'HTML, CSS, JavaScript basics' },
                    { name: 'Environmental Studies', code: 'BCA205', description: 'Environmental awareness' }
                ]
            },
            'BTECH': {
                'Semester 1': [
                    { name: 'Engineering Mathematics-I', code: 'BTECH101', description: 'Calculus and differential equations' },
                    { name: 'Engineering Physics', code: 'BTECH102', description: 'Physics for engineering applications' },
                    { name: 'Engineering Chemistry', code: 'BTECH103', description: 'Chemistry for engineering' },
                    { name: 'Programming for Problem Solving', code: 'BTECH104', description: 'C programming and problem solving' },
                    { name: 'English for Communication', code: 'BTECH105', description: 'Technical communication skills' }
                ],
                'Semester 2': [
                    { name: 'Engineering Mathematics-II', code: 'BTECH201', description: 'Linear algebra and complex analysis' },
                    { name: 'Engineering Graphics', code: 'BTECH202', description: 'Technical drawing and CAD' },
                    { name: 'Basic Electrical Engineering', code: 'BTECH203', description: 'Electrical circuits and machines' },
                    { name: 'Data Structures and Algorithms', code: 'BTECH204', description: 'DSA using C/C++' },
                    { name: 'Environmental Science', code: 'BTECH205', description: 'Environmental studies' }
                ]
            }
        };

        // Default study materials for each subject
        const defaultMaterials = [
            { title: 'Lecture Notes', type: 'PDF', description: 'Comprehensive lecture notes covering all topics' },
            { title: 'Assignment Questions', type: 'PDF', description: 'Practice problems and assignments' },
            { title: 'Previous Year Papers', type: 'PDF', description: 'Question papers from previous examinations' },
            { title: 'Reference Book', type: 'PDF', description: 'Recommended textbook and reference material' }
        ];

        let totalAddedSubjects = 0;
        let totalAddedMaterials = 0;

        // Insert subjects for each course and semester
        for (const [courseCategory, semesters] of Object.entries(defaultSubjects)) {
            console.log(`\n Processing ${courseCategory} subjects...`);

            for (const [semesterName, subjects] of Object.entries(semesters)) {
                console.log(`   Adding subjects for ${semesterName}...`);

                for (const subjectData of subjects) {
                    // Check if subject already exists
                    const existingSubject = await db.select()
                        .from(subjectsTable)
                        .where(eq(subjectsTable.code, subjectData.code))
                        .limit(1);

                    if (existingSubject.length > 0) {
                        console.log(`    ⏭️  Subject ${subjectData.code} already exists, skipping...`);
                        continue;
                    }

                    // Insert subject
                    const insertedSubject = await db.insert(subjectsTable).values({
                        category: courseCategory,
                        semesterName: semesterName,
                        name: subjectData.name,
                        code: subjectData.code,
                        description: subjectData.description,
                        isActive: true
                    }).returning();

                    console.log(`    Added subject: ${subjectData.name} (${subjectData.code})`);
                    totalAddedSubjects++;

                    // Add default study materials for this subject
                    const subjectId = insertedSubject[0].id;

                    for (const materialData of defaultMaterials) {
                        await db.insert(studyMaterialsTable).values({
                            subjectId: subjectId,
                            title: `${subjectData.name} - ${materialData.title}`,
                            type: materialData.type,
                            description: materialData.description,
                            fileUrl: `https://example.com/materials/${subjectData.code}_${materialData.title.replace(/\s+/g, '_').toLowerCase()}.pdf`,
                            downloadCount: Math.floor(Math.random() * 50), // Random download count for demo
                            isActive: true
                        });
                        totalAddedMaterials++;
                    }

                    console.log(`     Added ${defaultMaterials.length} study materials for ${subjectData.name}`);
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: "Default data seeding completed successfully!",
            summary: {
                subjectsAdded: totalAddedSubjects,
                materialsAdded: totalAddedMaterials,
                coursesProcessed: Object.keys(defaultSubjects).length
            }
        });

    } catch (error) {
        console.error(' Error seeding default data:', error);
        return NextResponse.json({
            success: false,
            error: "Failed to seed default data",
            details: error.message
        }, { status: 500 });
    }
}
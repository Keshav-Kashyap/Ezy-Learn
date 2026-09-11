import { db } from "@/config/db";
import { coursesTable, semestersTable, subjectsTable, studyMaterialsTable } from "@/config/schema";
import { NextResponse } from "next/server";

export async function GET() {
    return seedDatabase();
}

export async function POST() {
    return seedDatabase();
}

async function seedDatabase() {
    try {
        // Insert sample courses
        const courseData = await db.insert(coursesTable).values([
            {
                title: 'Master of Computer Applications',
                subtitle: 'MCA - 3 Year Program',
                description: 'A comprehensive 3-year program covering advanced computer applications and software development.',
                category: 'mca',
                duration: 3,
                bgColor: '#3B82F6',
                documentsCount: 0
            },
            {
                title: 'Bachelor of Computer Applications',
                subtitle: 'BCA - 3 Year Program',
                description: 'A 3-year undergraduate program focusing on computer applications and programming.',
                category: 'bca',
                duration: 3,
                bgColor: '#10B981',
                documentsCount: 0
            },
            {
                title: 'Bachelor of Technology',
                subtitle: 'B.Tech - 4 Year Program',
                description: '4-year engineering program with specializations in various fields.',
                category: 'btech',
                duration: 4,
                bgColor: '#8B5CF6',
                documentsCount: 0
            }
        ]).returning();

        console.log('Courses inserted:', courseData);

        // Insert semesters for MCA
        const semesterData = await db.insert(semestersTable).values([
            {
                category: 'mca',
                name: 'Semester 1',
                description: 'First semester of MCA'
            },
            {
                category: 'mca',
                name: 'Semester 2',
                description: 'Second semester of MCA'
            }
        ]).returning();

        console.log('Semesters inserted:', semesterData.length);

        // Insert sample subjects for MCA Semester 1
        const subjectData = await db.insert(subjectsTable).values([
            {
                category: 'mca',
                semesterName: 'Semester 1',
                name: 'Programming Fundamentals',
                code: 'MCA101',
                description: 'Introduction to programming concepts and C language'
            },
            {
                category: 'mca',
                semesterName: 'Semester 1',
                name: 'Computer Organization',
                code: 'MCA102',
                description: 'Basic computer architecture and organization'
            },
            {
                category: 'mca',
                semesterName: 'Semester 1',
                name: 'Discrete Mathematics',
                code: 'MCA103',
                description: 'Mathematical foundations for computer science'
            },
            {
                category: 'mca',
                semesterName: 'Semester 1',
                name: 'Database Management Systems',
                code: 'MCA104',
                description: 'Introduction to database concepts and SQL'
            }
        ]).returning();

        console.log('Subjects inserted:', subjectData.length);

        // Insert sample study materials
        await db.insert(studyMaterialsTable).values([
            {
                title: 'C Programming Notes - Chapter 1',
                type: 'PDF',
                fileUrl: 'https://example.com/files/c-programming-ch1.pdf',
                description: 'Comprehensive notes on C programming basics',
                tags: '["programming", "c-language", "notes"]',
                likes: 45,
                downloadCount: 120
            },
            {
                title: 'Database Management Systems - Complete Guide',
                type: 'PDF',
                fileUrl: 'https://example.com/files/dbms-guide.pdf',
                description: 'Complete guide to DBMS concepts and SQL',
                tags: '["database", "sql", "dbms"]',
                likes: 62,
                downloadCount: 98,
                isPopular: true
            }
        ]);

        console.log('Study materials inserted');

        return NextResponse.json({
            message: " Database seeding completed successfully!",
            data: {
                courses: courseData.length,
                semesters: semesterData.length,
                subjects: subjectData.length,
                materials: 2
            }
        });

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        return NextResponse.json({
            error: "Failed to seed database",
            details: error.message
        }, { status: 500 });
    }
}
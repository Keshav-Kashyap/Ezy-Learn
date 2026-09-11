import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { userProfileTable, usersTable, coursesTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Helper to ensure user_profile table and all required columns exist in Neon Database with correct types
async function ensureUserProfileTable() {
    try {
        const sql = neon(process.env.DATABASE_URL);

        // Fix column data type if "userId" was previously INTEGER in old DB table
        try {
            await sql`ALTER TABLE user_profile ALTER COLUMN "userId" TYPE VARCHAR(255) USING "userId"::VARCHAR(255);`;
        } catch (alterErr) {
            // If type conversion fails on old table, drop old broken user_profile table and recreate
            try {
                await sql`DROP TABLE IF EXISTS user_profile CASCADE;`;
            } catch (dropErr) {
                console.error("Error dropping old user_profile table:", dropErr);
            }
        }

        // Create table with correct VARCHAR(255) userId column
        await sql`
            CREATE TABLE IF NOT EXISTS user_profile (
                id SERIAL PRIMARY KEY,
                "userId" VARCHAR(255) UNIQUE,
                name VARCHAR(255),
                course VARCHAR(100),
                semester VARCHAR(100),
                "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;

        // Safely add any missing columns if user_profile table pre-existed
        await sql`ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS "userId" VARCHAR(255);`;
        await sql`ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS name VARCHAR(255);`;
        await sql`ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS course VARCHAR(100);`;
        await sql`ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS semester VARCHAR(100);`;
        await sql`ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`;
        await sql`ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`;
    } catch (err) {
        console.error("Error ensuring user_profile table & columns:", err);
    }
}

export async function GET() {
    try {
        const user = await currentUser();

        if (!user) {
            return NextResponse.json({
                success: false,
                error: "Not logged in"
            }, { status: 401 });
        }

        await ensureUserProfileTable();

        const userFullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Student';

        const profiles = await db.select()
            .from(userProfileTable)
            .where(eq(userProfileTable.userId, user.id))
            .limit(1);

        if (profiles.length > 0) {
            return NextResponse.json({
                success: true,
                exists: true,
                profile: profiles[0],
                user: {
                    id: user.id,
                    name: profiles[0].name || userFullName,
                    email: user.emailAddresses?.[0]?.emailAddress,
                    image: user.imageUrl
                }
            });
        }

        return NextResponse.json({
            success: true,
            exists: false,
            profile: null,
            user: {
                id: user.id,
                name: userFullName,
                email: user.emailAddresses?.[0]?.emailAddress,
                image: user.imageUrl
            }
        });

    } catch (error) {
        console.error("Error fetching user profile:", error);
        return NextResponse.json({
            success: false,
            error: error.message || "Failed to fetch user profile"
        }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const user = await currentUser();

        if (!user) {
            return NextResponse.json({
                success: false,
                error: "Not logged in"
            }, { status: 401 });
        }

        const body = await req.json();
        const { name, course, semester } = body;

        if (!name || !course) {
            return NextResponse.json({
                success: false,
                error: "Name and Course are required"
            }, { status: 400 });
        }

        const finalSemester = (course === 'Other' || course === 'Others') ? (semester || "N/A") : semester;

        if (!finalSemester) {
            return NextResponse.json({
                success: false,
                error: "Semester is required"
            }, { status: 400 });
        }

        await ensureUserProfileTable();

        // Check if profile already exists
        const existingProfile = await db.select()
            .from(userProfileTable)
            .where(eq(userProfileTable.userId, user.id))
            .limit(1);

        let savedProfile;

        if (existingProfile.length > 0) {
            // Update existing profile
            const updated = await db.update(userProfileTable)
                .set({
                    name: name.trim(),
                    course: course.trim(),
                    semester: finalSemester.trim(),
                    updatedAt: new Date()
                })
                .where(eq(userProfileTable.userId, user.id))
                .returning();
            savedProfile = updated[0];
        } else {
            // Insert new profile
            const inserted = await db.insert(userProfileTable)
                .values({
                    userId: user.id,
                    name: name.trim(),
                    course: course.trim(),
                    semester: finalSemester.trim()
                })
                .returning();
            savedProfile = inserted[0];
        }

        // Also update name in usersTable if user exists
        try {
            await db.update(usersTable)
                .set({ name: name.trim(), updatedAt: new Date() })
                .where(eq(usersTable.userId, user.id));
        } catch (uErr) {
            console.error("Error updating usersTable name:", uErr);
        }

        return NextResponse.json({
            success: true,
            message: "Profile created successfully",
            profile: savedProfile
        });

    } catch (error) {
        console.error("Error saving user profile:", error);
        return NextResponse.json({
            success: false,
            error: error.message || "Failed to save profile"
        }, { status: 500 });
    }
}

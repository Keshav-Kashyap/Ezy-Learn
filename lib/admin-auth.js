import { db } from "../config/db.jsx";
import { usersTable } from "../config/schema.jsx";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

export async function checkAdminAccess() {
    try {
        const user = await currentUser();

        if (!user) {
            // In development mode, fallback to first admin in database
            if (process.env.NODE_ENV === 'development') {
                const adminUsers = await db.select().from(usersTable).where(eq(usersTable.role, 'admin')).limit(1);
                if (adminUsers[0]) {
                    return {
                        isAuthenticated: true,
                        isAdmin: true,
                        user: adminUsers[0],
                        message: "Dev fallback admin access granted"
                    };
                }
            }
            return { isAuthenticated: false, isAdmin: false, error: "Not logged in" };
        }

        // Check database connection first
        if (!process.env.DATABASE_URL) {
            console.warn('🚨 DATABASE_URL not found in environment variables');
            return {
                isAuthenticated: true,
                isAdmin: false,
                error: "Database connection not configured"
            };
        }

        // Check if user exists in database with admin role
        const dbUser = await db.select()
            .from(usersTable)
            .where(eq(usersTable.userId, user.id))
            .limit(1);

        if (dbUser.length === 0) {
            // User doesn't exist in database, create them as student
            const newUser = await db.insert(usersTable).values({
                userId: user.id,
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown',
                email: user.emailAddresses?.[0]?.emailAddress || '',
                role: 'student',
                isActive: true
            }).returning();

            return {
                isAuthenticated: true,
                isAdmin: false,
                user: newUser[0],
                message: "New user created as student"
            };
        }

        const userRecord = dbUser[0];

        return {
            isAuthenticated: true,
            isAdmin: userRecord.role === 'admin' && userRecord.isActive,
            user: userRecord
        };

    } catch (error) {
        console.error('Admin check error:', error);

        // Check if it's a database connection error
        if (error.message.includes('database connection') ||
            error.message.includes('DATABASE_URL') ||
            error.message.includes('No database connection string')) {
            return {
                isAuthenticated: true,
                isAdmin: false,
                error: "Database connection string was not provided. Please set DATABASE_URL environment variable."
            };
        }

        return { isAuthenticated: false, isAdmin: false, error: error.message };
    }
}
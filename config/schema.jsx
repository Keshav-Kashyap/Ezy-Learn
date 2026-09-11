import { integer, pgTable, varchar, serial, text, timestamp, boolean } from "drizzle-orm/pg-core";

// Users Table
export const usersTable = pgTable("users", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: varchar({ length: 255 }).notNull().unique(), // Clerk user ID
    name: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 255 }).notNull().unique(),
    image: text("image"), 
    role: varchar({ length: 50 }).default('student'), // 'admin' or 'student'
    isActive: boolean().default(true),
    credits: integer().default(10),
    hasReviewed: boolean().default(false), // Track if user has submitted at least one review
    createdAt: timestamp().defaultNow(),
    updatedAt: timestamp().defaultNow()
});

// Courses Table
export const coursesTable = pgTable("courses", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    title: varchar({ length: 255 }).notNull(),
    subtitle: varchar({ length: 255 }),
    description: text(),
    category: varchar({ length: 100 }).notNull(),
    duration: integer().default(3), // Duration in years (e.g., 3 for BCA)
    image: varchar({ length: 255 }),
    bgColor: varchar({ length: 100 }),
    isActive: boolean().default(true),
    documentsCount: integer().default(0),
    createdAt: timestamp().defaultNow(),
    updatedAt: timestamp().defaultNow()
});

// Semesters Table
export const semestersTable = pgTable("semesters", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    category: text().notNull(), // Links to coursesTable.category
    name: varchar({ length: 100 }).notNull(),
    description: text(),
    isActive: boolean().default(true),
    createdAt: timestamp().defaultNow(),
    updatedAt: timestamp().defaultNow()
});

// Subjects Table
export const subjectsTable = pgTable("subjects", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    category: text().notNull(), // Links to coursesTable.category
    semesterName: varchar({ length: 100 }).notNull(), // Links to semestersTable.name
    name: varchar({ length: 255 }).notNull(),
    code: varchar({ length: 50 }),
    description: text(),
    isActive: boolean().default(true),
    createdAt: timestamp().defaultNow(),
    updatedAt: timestamp().defaultNow()
});

// Study Materials Table (Independent - can be reused across subjects)
export const studyMaterialsTable = pgTable("study_materials", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    title: varchar({ length: 255 }).notNull(),
    type: varchar({ length: 50 }), // Optional - PDF, DOC, VIDEO, etc.
    fileUrl: varchar({ length: 500 }),
    description: text(),
    tags: text(), // JSON array as text
    likes: integer("likes").default(0),
    imageUrl: text(), // Optional - Admin can add custom image
    downloadCount: integer().default(0),
    isActive: boolean().default(true),
    isPopular: boolean().default(false),
    createdAt: timestamp().defaultNow(),
    updatedAt: timestamp().defaultNow()
});

// Syllabus Table (Shared across semesters in integrated courses)
// Example: MCA Integrated 1st year syllabus shows in both Sem 1 and Sem 2
export const syllabusTable = pgTable("syllabus", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    category: text().notNull(), // Links to coursesTable.category (e.g., "MCA Integrated")
    year: integer().notNull(), // Academic year (1, 2, 3, etc.)
    title: varchar({ length: 255 }).notNull(), // Syllabus title
    description: text(),
    fileUrl: varchar({ length: 500 }).notNull(), // PDF/DOC link
    imageUrl: text(), // Optional thumbnail
    uploadedBy: varchar({ length: 255 }), // Admin who uploaded
    isActive: boolean().default(true),
    createdAt: timestamp().defaultNow(),
    updatedAt: timestamp().defaultNow()
});

// Material-Subject Mapping Table (Many-to-Many relationship)
// One material can be used in multiple subjects across different courses/semesters
export const materialSubjectMappingTable = pgTable("material_subject_mapping", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    materialId: integer().references(() => studyMaterialsTable.id).notNull(),
    subjectId: integer().references(() => subjectsTable.id).notNull(),
    isPinned: boolean().default(false), // Pin materials to show at top (max 3 per subject)
    pinnedAt: timestamp(), // Track when it was pinned
    addedAt: timestamp().defaultNow()
});

// User Course Enrollments
export const enrollmentsTable = pgTable("enrollments", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer().references(() => usersTable.id),
    courseId: integer().references(() => coursesTable.id),
    enrolledAt: timestamp().defaultNow(),
    isActive: boolean().default(true)
});

// Downloads History
export const downloadsTable = pgTable("downloads", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer().references(() => usersTable.id),
    materialId: integer().references(() => studyMaterialsTable.id),
    downloadedAt: timestamp().defaultNow()
});

// Notifications Table
export const notificationsTable = pgTable("notifications", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer().references(() => usersTable.id), // null means notification for all users
    type: varchar({ length: 50 }).notNull(), // 'course_created', 'semester_created', 'subject_created', 'material_uploaded'
    title: varchar({ length: 255 }).notNull(),
    message: text().notNull(),
    courseCode: varchar({ length: 50 }),
    courseName: varchar({ length: 255 }),
    semesterName: varchar({ length: 100 }),
    subjectName: varchar({ length: 255 }),
    materialTitle: varchar({ length: 255 }),
    actionUrl: varchar({ length: 500 }), // URL to navigate when clicked
    isRead: boolean().default(false),
    createdAt: timestamp().defaultNow()
});

// Reviews Table
export const reviewsTable = pgTable("reviews", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: varchar({ length: 255 }).notNull(), // Clerk user ID
    userName: varchar({ length: 255 }).notNull(),
    userEmail: varchar({ length: 255 }),
    rating: integer().notNull(), // 1-5 stars
    reviewText: text().notNull(),
    isApproved: boolean().default(true), // For moderation
    isFeatured: boolean().default(false),
    createdAt: timestamp().defaultNow()
});

// Join Our Team / Contact submissions
export const contactSubmissionsTable = pgTable("contact_submissions", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 255 }).notNull(),
    subject: varchar({ length: 255 }).notNull(),
    message: text().notNull(),
    createdAt: timestamp().defaultNow()
});

// User Profile Table
export const userProfileTable = pgTable("user_profile", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: varchar({ length: 255 }).notNull().unique(), // Clerk user ID
    name: varchar({ length: 255 }).notNull(),
    course: varchar({ length: 100 }).notNull(),
    semester: varchar({ length: 100 }).notNull(),
    createdAt: timestamp().defaultNow(),
    updatedAt: timestamp().defaultNow()
});



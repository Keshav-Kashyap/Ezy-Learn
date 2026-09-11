import { google } from 'googleapis';
import { Readable } from 'stream';
import { db } from "@/config/db";
import { subjectsTable, semestersTable, coursesTable } from "@/config/schema";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const SERVICE_ACCOUNT_PRIVATE_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
    ? process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n')
    : null;

// Global variable to store in-memory refresh token
let memoryRefreshToken = process.env.GOOGLE_REFRESH_TOKEN || null;

export function setMemoryRefreshToken(token) {
    memoryRefreshToken = token;
}

export function getMemoryRefreshToken() {
    return memoryRefreshToken || process.env.GOOGLE_REFRESH_TOKEN || null;
}

/**
 * Get OAuth2 Client for Google Drive API
 */
export function getOAuth2Client() {
    if (!CLIENT_ID || !CLIENT_SECRET) {
        throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required in .env');
    }

    const oauth2Client = new google.auth.OAuth2(
        CLIENT_ID,
        CLIENT_SECRET,
        REDIRECT_URI
    );

    const activeRefreshToken = getMemoryRefreshToken();
    if (activeRefreshToken) {
        oauth2Client.setCredentials({ refresh_token: activeRefreshToken });
    }

    return oauth2Client;
}

/**
 * Get authorized Google Auth client (Service Account or OAuth2)
 */
export function getGoogleAuthClient() {
    // 1. Service Account Authentication (Best for backend server-to-server)
    if (SERVICE_ACCOUNT_EMAIL && SERVICE_ACCOUNT_PRIVATE_KEY) {
        return new google.auth.JWT({
            email: SERVICE_ACCOUNT_EMAIL,
            key: SERVICE_ACCOUNT_PRIVATE_KEY,
            scopes: ['https://www.googleapis.com/auth/drive']
        });
    }

    // 2. OAuth2 Client Authentication
    return getOAuth2Client();
}

/**
 * Get Google Drive v3 client instance
 */
export function getDriveClient() {
    const auth = getGoogleAuthClient();
    const activeRefreshToken = getMemoryRefreshToken();

    // If using OAuth without refresh token
    if (!SERVICE_ACCOUNT_EMAIL && !activeRefreshToken) {
        throw new Error('Google Drive Refresh Token missing. Please set GOOGLE_REFRESH_TOKEN in your .env file or configure a Service Account.');
    }

    return google.drive({ version: 'v3', auth });
}

/**
 * Helper to find or create a folder in Google Drive under parentFolderId
 */
export async function findOrCreateFolder(drive, folderName, parentFolderId = null) {
    // Sanitize folder name to prevent query breakage
    const cleanName = folderName.replace(/'/g, "\\'");
    let query = `name = '${cleanName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    if (parentFolderId) {
        query += ` and '${parentFolderId}' in parents`;
    }

    try {
        const response = await drive.files.list({
            q: query,
            fields: 'files(id, name)',
            spaces: 'drive',
        });

        if (response.data.files && response.data.files.length > 0) {
            return response.data.files[0].id;
        }
    } catch (err) {
        console.warn(`Error searching for folder "${folderName}":`, err.message);
        if (err.message?.includes('invalid_grant') || err.message?.includes('Unauthenticated') || err.code === 401 || err.status === 401) {
            throw new Error(`Google Drive Auth Expired/Invalid: ${err.message}. Please connect Google Drive by opening http://localhost:3000/api/admin/google/auth in your browser.`);
        }
    }

    // Create folder if not found
    const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
    };
    if (parentFolderId) {
        fileMetadata.parents = [parentFolderId];
    }

    const folder = await drive.files.create({
        requestBody: fileMetadata,
        fields: 'id, name',
    });

    console.log(` Created Google Drive Folder: "${folderName}" (ID: ${folder.data.id})`);
    return folder.data.id;
}

/**
 * Get or create nested folder hierarchy for Course > Semester > Subject
 * Hierarchy: Root (EzyStudy_Materials) -> Course (MCA) -> Semester (Semester 2) -> Subject (Data Structures (KCA-201))
 */
export async function getTargetFolderId(drive, { courseCategory, semesterName, subjectName, subjectCode }) {
    // 1. Root folder
    const rootFolderId = await findOrCreateFolder(drive, 'EzyStudy_Materials');

    // 2. Course folder (e.g. MCA, BCA, BTECH)
    const cleanCourse = (courseCategory || 'General').toUpperCase();
    const courseFolderId = await findOrCreateFolder(drive, cleanCourse, rootFolderId);

    // 3. Semester folder (e.g. Semester 1, Semester 2)
    const cleanSemester = semesterName || 'General Semester';
    const semesterFolderId = await findOrCreateFolder(drive, cleanSemester, courseFolderId);

    // 4. Subject folder if subjectName provided
    if (subjectName) {
        const folderName = subjectCode ? `${subjectName} (${subjectCode})` : subjectName;
        const subjectFolderId = await findOrCreateFolder(drive, folderName, semesterFolderId);
        return subjectFolderId;
    }

    return semesterFolderId;
}

/**
 * Safe background helper to create Google Drive folder for Course/Semester/Subject
 */
export async function createDriveFolderForEntity({ courseCategory, semesterName, subjectName, subjectCode }) {
    try {
        const activeRefreshToken = getMemoryRefreshToken();
        const serviceAccount = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
        if (!activeRefreshToken && !serviceAccount) {
            return null;
        }

        const drive = getDriveClient();
        const folderId = await getTargetFolderId(drive, {
            courseCategory,
            semesterName,
            subjectName,
            subjectCode,
        });

        console.log(` Auto-created Google Drive folder for ${courseCategory || ''} ${semesterName || ''} ${subjectName || ''} (ID: ${folderId})`);
        return folderId;
    } catch (err) {
        console.warn(" Auto-creating Google Drive folder skipped:", err.message);
        return null;
    }
}

/**
 * Upload file buffer directly to Google Drive folder and make it publicly viewable
 */
export async function uploadFileToGoogleDrive({ buffer, fileName, mimeType, folderId }) {
    const drive = getDriveClient();

    // Convert Buffer to Readable Stream
    const bufferStream = new Readable();
    bufferStream.push(buffer);
    bufferStream.push(null);

    const fileMetadata = {
        name: fileName,
        parents: folderId ? [folderId] : [],
    };

    const media = {
        mimeType: mimeType || 'application/pdf',
        body: bufferStream,
    };

    const uploadedFile = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, name, webViewLink, webContentLink',
    });

    const fileId = uploadedFile.data.id;

    // Make file readable by anyone with the link
    try {
        await drive.permissions.create({
            fileId: fileId,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
        });
    } catch (permError) {
        console.warn(' Google Drive permission setting warning:', permError.message);
    }

    const webViewLink = uploadedFile.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
    const webContentLink = uploadedFile.data.webContentLink || `https://drive.google.com/uc?export=download&id=${fileId}`;

    return {
        fileId,
        fileName: uploadedFile.data.name,
        webViewLink: webViewLink,
        webContentLink: webContentLink,
        fileUrl: webViewLink,
    };
}

/**
 * Pre-create all folders in Google Drive for all courses, semesters, and subjects stored in database
 */
export async function syncAllFoldersToDrive() {
    const drive = getDriveClient();

    // Fetch all courses, semesters, subjects
    const subjects = await db.select().from(subjectsTable);
    const courses = await db.select().from(coursesTable);
    const semesters = await db.select().from(semestersTable);

    console.log(`Syncing Google Drive folders for ${courses.length} courses, ${semesters.length} semesters, ${subjects.length} subjects...`);

    const rootFolderId = await findOrCreateFolder(drive, 'EzyStudy_Materials');

    let createdFoldersCount = 0;
    const syncedFoldersList = [];

    // Create folders for subjects
    for (const subject of subjects) {
        const folderId = await getTargetFolderId(drive, {
            courseCategory: subject.category,
            semesterName: subject.semesterName,
            subjectName: subject.name,
            subjectCode: subject.code,
        });

        createdFoldersCount++;
        syncedFoldersList.push({
            id: folderId,
            course: subject.category,
            semester: subject.semesterName,
            subject: subject.name,
            code: subject.code,
        });
    }

    return {
        success: true,
        rootFolderId,
        totalFoldersSynced: createdFoldersCount,
        folders: syncedFoldersList,
    };
}

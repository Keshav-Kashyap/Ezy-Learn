import { Client, Storage, ID } from 'appwrite';

// Initialize Appwrite client
let appwriteClient;
let appwriteStorage;

try {
    if (!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
        !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
        console.warn(' Appwrite environment variables not configured');
    } else {
        appwriteClient = new Client()
            .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
            .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

        appwriteStorage = new Storage(appwriteClient);
        console.log(' Appwrite client initialized successfully');
    }
} catch (error) {
    console.error('❌ Failed to initialize Appwrite client:', error);
}

export { appwriteClient, appwriteStorage, ID };

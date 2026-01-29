const admin = require('firebase-admin');
const path = require('path');

let db = null;

/**
 * Initialize Firebase Admin SDK
 */
function initializeFirebase() {
    if (db) {
        return db;
    }

    try {
        // Try to load service account key file
        const serviceAccountPath = path.join(__dirname, '../../serviceAccountKey.json');
        const serviceAccount = require(serviceAccountPath);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });

        console.log('✅ Firebase initialized with serviceAccountKey.json');
    } catch (error) {
        // Fallback to environment variables
        if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
                })
            });
            console.log('✅ Firebase initialized with environment variables');
        } else {
            throw new Error('Firebase credentials not found. Please provide serviceAccountKey.json or set environment variables.');
        }
    }

    db = admin.firestore();
    return db;
}

/**
 * Get Firestore instance
 */
function getFirestore() {
    if (!db) {
        return initializeFirebase();
    }
    return db;
}

module.exports = {
    initializeFirebase,
    getFirestore
};

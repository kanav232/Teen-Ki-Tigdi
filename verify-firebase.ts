
import 'dotenv/config';
import { db } from './firebase-admin';
import * as admin from 'firebase-admin';

async function verify() {
    console.log('--- Verification Start ---');
    console.log('GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS);

    // Check if db is explicitly our Mock class
    // In firebase-admin.ts, the MockFirestore class is local, so checking constructor name is a proxy.
    // Accessing constructor.name on the instance:
    const dbType = db.constructor.name;
    console.log('DB Instance Type:', dbType);

    if (dbType === 'MockFirestore') {
        console.error('❌ Failed: Application fell back to MockFirestore.');
        process.exit(1);
    }

    console.log('✅ Application initialized Real Firestore client.');

    try {
        console.log('Attempting to list collections...');
        const collections = await db.listCollections();
        console.log(`✅ Success! Found ${collections.length} collections.`);
        collections.forEach((c: any) => console.log(' -', c.id));
    } catch (err: any) {
        console.error('⚠️  Connected to Firebase Auth, but failed to list collections (this confirms Auth is working, but maybe permissions/project ID issues?)');
        console.error('Error:', err.message);
    }
}

verify().catch(err => console.error('Fatal:', err));

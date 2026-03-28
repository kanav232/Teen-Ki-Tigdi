import 'dotenv/config';
import { db } from '../firebase-admin';

async function clearIncidents() {
  console.log('[Script] Fetching old incidents from Firestore...');
  const snapshot = await db.collection('incidents').get();
  
  if (snapshot.empty) {
      console.log('[Script] No incidents found to delete. Database is clean!');
      process.exit(0);
  }

  console.log(`[Script] Found ${snapshot.docs.length} old incidents. Deleting...`);
  
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  console.log(`✅ Successfully wiped ${snapshot.docs.length} outdated incidents. Your map is now clean!`);
  process.exit(0);
}

clearIncidents().catch(err => {
    console.error('[Script] Failed to clear incidents:', err);
    process.exit(1);
});

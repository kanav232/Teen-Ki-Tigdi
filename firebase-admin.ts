
import * as admin from 'firebase-admin';

// Check if we are in a "Real" environment
console.log('[FirebaseAdmin] Checking credentials. Env Var:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
const hasCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_SERVICE_ACCOUNT;

let db: any;

if (hasCredentials) {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: 'studio-5035044861-42bc5' // Explicitly set project ID
    });
    db = admin.firestore();
    db.settings({ ignoreUndefinedProperties: true });
  } else {
    db = admin.firestore();
  }
} else {

  console.warn('⚠️  NO FIREBASE CREDENTIALS FOUND. USING LOCAL FILE DB (data/incidents.json).');

  const fs = require('fs');
  const path = require('path');
  const DB_PATH = path.join(process.cwd(), 'data', 'incidents.json');

  // --- FILE-BASED MOCK FIRESTORE ---
  class MockFirestore {
    private data: Record<string, any[]> = {};

    constructor() {
      this.load();
    }

    private load() {
      try {
        if (fs.existsSync(DB_PATH)) {
          const fileContent = fs.readFileSync(DB_PATH, 'utf-8');
          this.data = JSON.parse(fileContent);
          console.log(`[MockDB] Loaded ${Object.keys(this.data).length} collections from disk.`);
        }
      } catch (err) {
        console.error('[MockDB] Failed to load DB:', err);
        this.data = {};
      }
    }

    private save() {
      try {
        // Ensure directory exists
        const dir = path.dirname(DB_PATH);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(DB_PATH, JSON.stringify(this.data, null, 2));
        // console.log('[MockDB] Saved to disk.'); // noisy
      } catch (err) {
        console.error('[MockDB] Failed to save DB:', err);
      }
    }

    collection(path: string) {
      if (!this.data[path]) this.data[path] = [];
      return new MockCollection(this.data[path], path, () => this.save());
    }
  }

  class MockCollection {
    constructor(private data: any[], private path: string, private onUpdate: () => void) { }

    doc(id?: string) {
      return new MockDoc(this.data, id || `mock-id-${Date.now()}-${Math.random()}`, this.onUpdate);
    }

    async add(data: any) {
      const id = `mock-id-${Date.now()}`;
      const docData = { id, ...data };
      this.data.push(docData);
      console.log(`[MockDB] Added doc to ${this.path}:`, docData);
      this.onUpdate();
      return { id };
    }

    where(field: string, op: string, value: any) {
      // Simple filter for mock purposes
      const filtered = this.data.filter(item => {
        if (op == '==') return item[field] === value;
        if (op == 'in' && Array.isArray(value)) return value.includes(item[field]);
        return true;
      });
      return new MockQuery(filtered, this.onUpdate); // Pass persist callback
    }
  }

  class MockQuery {
    constructor(private data: any[], private onUpdate: () => void) { }

    async get() {
      return {
        forEach: (callback: (doc: any) => void) => {
          this.data.forEach(item => {
            callback({
              id: item.id,
              data: () => item,
              ref: new MockDocReference(item, this.onUpdate)
            });
          });
        },
        empty: this.data.length === 0,
        docs: this.data.map(item => ({
          id: item.id,
          data: () => item,
          ref: new MockDocReference(item, this.onUpdate)
        }))
      };
    }

    where(field: string, op: string, value: any) {
      const filtered = this.data.filter(item => {
        if (op == '==') return item[field] === value;
        if (op == 'in' && Array.isArray(value)) return value.includes(item[field]);
        return true;
      });
      return new MockQuery(filtered, this.onUpdate);
    }
  }

  class MockDocReference {
    constructor(private item: any, private onUpdate: () => void) { }

    async update(data: any) {
      Object.assign(this.item, data);
      console.log(`[MockDB] Updated doc ${this.item.id}:`, data);
      this.onUpdate();
    }
  }

  class MockDoc {
    constructor(private collectionData: any[], public readonly id: string, private onUpdate: () => void) { }

    async set(data: any) {
      const existing = this.collectionData.find(d => d.id === this.id);
      if (existing) {
        Object.assign(existing, data);
      } else {
        this.collectionData.push({ id: this.id, ...data });
      }
      console.log(`[MockDB] Set doc ${this.id}`);
      this.onUpdate();
    }
  }

  db = new MockFirestore();
}

export { db, admin };

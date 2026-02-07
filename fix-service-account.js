const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'service-account.json');
const backupPath = path.join(process.cwd(), 'service-account.json.bak');

try {
    if (fs.existsSync(filePath)) {
        // 1. Backup
        fs.copyFileSync(filePath, backupPath);
        console.log('✅ Backed up to service-account.json.bak');

        // 2. Read
        const content = fs.readFileSync(filePath, 'utf8');
        const json = JSON.parse(content);

        // 3. Fix
        let key = json.private_key;
        if (!key) {
            console.error('❌ private_key not found in JSON');
            process.exit(1);
        }

        // Look for the start of the actual key payload (usually MII...)
        const anchor = 'MII';
        const index = key.indexOf(anchor);

        if (index !== -1) {
            // Keep everything from MII onwards
            // Add the correct header
            // Ensure ends with correct footer (it seems the footer was present in the file content based on my reading)
            // But let's check if the footer is missing too?
            // Step 5 showed: ...\n-----END PRIVATE KEY-----\n
            // So the footer is likely fine.

            const payloadAndFooter = key.substring(index);
            const newKey = '-----BEGIN PRIVATE KEY-----\n' + payloadAndFooter;

            json.private_key = newKey;

            // 4. Write
            fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
            console.log('✅ Fixed private_key format and saved service-account.json');
        } else {
            console.error('❌ Could not find MII anchor in private_key. Aborting fix.');
        }

    } else {
        console.error('❌ File not found:', filePath);
    }
} catch (err) {
    console.error('❌ Error:', err.message);
}

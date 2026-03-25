const { execSync } = require('node:child_process');

const requiredVars = ['APPLE_ID', 'APPLE_APP_SPECIFIC_PASSWORD', 'APPLE_TEAM_ID'];
const missing = requiredVars.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(`[signing-check] Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

try {
  const output = execSync('security find-identity -v -p codesigning', { encoding: 'utf8' });
  if (!output.includes('Developer ID Application')) {
    console.error('[signing-check] No "Developer ID Application" identity found in keychain.');
    process.exit(1);
  }
} catch (error) {
  console.error('[signing-check] Unable to inspect code-signing identities. Is Keychain access available?');
  process.exit(1);
}

console.log('[signing-check] Environment and keychain identity look good.');

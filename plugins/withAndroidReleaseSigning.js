// plugins/withAndroidReleaseSigning.js
// Injects release signingConfig that reads android/keystore.properties (local, gitignored).
const { withAppBuildGradle } = require('@expo/config-plugins');

const KEYSTORE_PROPERTIES_BLOCK = `
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
`;

const RELEASE_SIGNING_CONFIG = `
        release {
            if (keystorePropertiesFile.exists()) {
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }`;

function withAndroidReleaseSigning(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy') {
      return config;
    }

    let contents = config.modResults.contents;

    if (contents.includes('keystorePropertiesFile')) {
      return config;
    }

    contents = contents.replace(
      /def projectRoot = rootDir\.getAbsoluteFile\(\)\.getParentFile\(\)\.getAbsolutePath\(\)\n/,
      (match) => `${match}${KEYSTORE_PROPERTIES_BLOCK}`
    );

    contents = contents.replace(
      /(signingConfigs\s*\{\s*debug\s*\{[\s\S]*?\}\s*)\}/,
      `$1${RELEASE_SIGNING_CONFIG}\n    }`
    );

    contents = contents.replace(
      /(buildTypes\s*\{\s*debug\s*\{[\s\S]*?\}\s*release\s*\{)\s*\n\s*\/\/ Caution! In production[\s\S]*?\n\s*signingConfig signingConfigs\.debug/,
      `$1
            if (keystorePropertiesFile.exists()) {
                signingConfig signingConfigs.release
            } else {
                println("WARNING: android/keystore.properties not found — signing release with debug keystore")
                signingConfig signingConfigs.debug
            }`
    );

    config.modResults.contents = contents;
    return config;
  });
}

module.exports = withAndroidReleaseSigning;

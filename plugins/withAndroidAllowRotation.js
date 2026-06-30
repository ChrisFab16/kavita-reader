// plugins/withAndroidAllowRotation.js
const { withAndroidManifest, AndroidConfig } = require('@expo/config-plugins');

/** Respect system auto-rotate on MainActivity (013 landscape interface). */
const withAndroidAllowRotation = (config) => {
  return withAndroidManifest(config, (config) => {
    const mainActivity = AndroidConfig.Manifest.getMainActivityOrThrow(config.modResults);
    mainActivity.$['android:screenOrientation'] = 'fullUser';
    return config;
  });
};

module.exports = withAndroidAllowRotation;

// plugins/withAndroidReleaseApkName.js
const { withAppBuildGradle } = require('@expo/config-plugins');
const { mergeContents } = require('@expo/config-plugins/build/utils/generateCode');

const RELEASE_APK_TAG = 'kavita-reader-release-apk-name';

const withAndroidReleaseApkName = (config) => {
  const appSlug = config.slug || 'kavita-reader';

  return withAppBuildGradle(config, (config) => {
    const merge = mergeContents({
      src: config.modResults.contents,
      newSrc: `
android.applicationVariants.configureEach { variant ->
    variant.outputs.configureEach { output ->
        if (output.outputFileName != null && output.outputFileName.endsWith('.apk')) {
            output.outputFileName = "${appSlug}-\${variant.versionName}.apk"
        }
    }
}
`.trim(),
      tag: RELEASE_APK_TAG,
      anchor: /^dependencies \{/m,
      offset: 0,
      comment: '//',
    });

    if (!merge.didMerge && !merge.didClear) {
      throw new Error(
        'Cannot add release APK naming — dependencies anchor not found in app/build.gradle'
      );
    }

    config.modResults.contents = merge.contents;
    return config;
  });
};

module.exports = withAndroidReleaseApkName;

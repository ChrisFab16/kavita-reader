# Local Android release signing

Release APKs/AABs use `android/keystore.properties` + `android/app/release.keystore`. Both live under the generated `android/` folder and are **not** committed.

## First-time setup

```bash
# 1. Generate a release keystore (android/ must exist — run `npx expo prebuild --platform android` first)
keytool -genkeypair -v -storetype PKCS12 \
  -keystore android/app/release.keystore \
  -alias kavita-reader \
  -keyalg RSA -keysize 2048 -validity 10000

# 2. Copy and edit credentials
cp android-signing/keystore.properties.example android/keystore.properties
```

## Build

```bash
cd android && ./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/app-release.apk
```

If `keystore.properties` is missing, release builds fall back to the debug keystore (with a Gradle warning).

The Expo plugin `plugins/withAndroidReleaseSigning.js` re-applies this wiring after `expo prebuild`.

// plugins/withAndroidCleartextTraffic.js
const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

const withCleartextManifest = (config) => {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    const app = manifest.manifest.application[0];

    app.$['android:usesCleartextTraffic'] = 'true';
    app.$['android:networkSecurityConfig'] = '@xml/network_security_config';

    if (!manifest.manifest.queries) {
      manifest.manifest.queries = [];
    }

    const queries = manifest.manifest.queries;
    if (!queries[0]) {
      queries[0] = { intent: [] };
    }
    if (!queries[0].intent) {
      queries[0].intent = [];
    }

    const hasHttp = queries[0].intent.some(
      (i) => i?.data?.[0]?.['$']?.['android:scheme'] === 'http'
    );

    if (!hasHttp) {
      queries[0].intent.push({
        action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
        category: [{ $: { 'android:name': 'android.intent.category.BROWSABLE' } }],
        data: [{ $: { 'android:scheme': 'http' } }],
      });
    }

    return config;
  });
};

const withNetworkSecurityConfig = (config) => {
  return withDangerousMod(config, [
    'android',
    (config) => {
      const xmlDir = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'res',
        'xml'
      );

      if (!fs.existsSync(xmlDir)) {
        fs.mkdirSync(xmlDir, { recursive: true });
      }

      const xmlPath = path.join(xmlDir, 'network_security_config.xml');

      // Allow cleartext HTTP, trust system + user certs (user certs needed for self-signed HTTPS)
      const xmlContent = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="true">
    <trust-anchors>
      <certificates src="system"/>
      <certificates src="user"/>
    </trust-anchors>
  </base-config>
</network-security-config>`;

      fs.writeFileSync(xmlPath, xmlContent, 'utf8');
      console.log('✅ network_security_config.xml written');

      return config;
    },
  ]);
};

const withAndroidCleartextTraffic = (config) => {
  config = withCleartextManifest(config);
  config = withNetworkSecurityConfig(config);
  return config;
};

module.exports = withAndroidCleartextTraffic;
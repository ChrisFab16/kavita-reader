const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Gradle/CMake artifacts under node_modules/*/android only — do NOT match
// npm package folders like expo-asset/build or pretty-format/build.
const nativeBuildArtifact =
  /[/\\]node_modules[/\\][^/\\]+[/\\]android[/\\](?:\.cxx|build)(?:[/\\].*)?$/;

config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList)
    ? config.resolver.blockList
    : config.resolver.blockList
      ? [config.resolver.blockList]
      : []),
  nativeBuildArtifact,
];

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  'expo-asset': path.resolve(__dirname, 'node_modules/expo-asset'),
};

module.exports = config;

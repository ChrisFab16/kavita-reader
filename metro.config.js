const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Gradle/CMake build artifacts under node_modules can appear and vanish during
// native builds; watching them crashes Metro (ENOENT on deleted .cxx dirs).
const nativeBuildArtifact =
  /[/\\](?:\.cxx|build)[/\\].*|(?:^|[/\\])android[/\\](?:\.cxx|build)[/\\].*/;

config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList)
    ? config.resolver.blockList
    : config.resolver.blockList
      ? [config.resolver.blockList]
      : []),
  nativeBuildArtifact,
];

module.exports = config;

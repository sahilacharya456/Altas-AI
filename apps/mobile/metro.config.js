const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

// Find the project and workspace directories
const projectRoot = __dirname;
// This can be replaced with `find-yarn-workspace-root`
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot, { isCSSEnabled: true });

// 1. Watch all files within the monorepo (spread defaults to satisfy expo-doctor)
config.watchFolders = [...(config.watchFolders || []), workspaceRoot];
// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
// 3. Keep hierarchical lookup at Expo's default for SDK compatibility checks.
config.resolver.disableHierarchicalLookup = false;
config.resolver.unstable_enablePackageExports = false;
// 4. Prefer Zustand's React Native/CommonJS entry on web too. The ESM build
// leaves import.meta.env in Metro's classic dev bundle, which breaks browsers.
config.resolver.extraNodeModules = {
  zustand: path.resolve(workspaceRoot, "node_modules/zustand/index.js"),
};

module.exports = withNativeWind(config, { input: "./global.css" });

module.exports = ({ config = {} } = {}) => {
  const isProduction = process.env.EAS_BUILD_PROFILE?.trim().toLowerCase() === 'production';
  const buildArchs = isProduction
    ? ['armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64']
    : ['arm64-v8a'];

  const existingPlugin = (config.plugins || []).find((p) => {
    if (Array.isArray(p)) return p[0] === 'expo-build-properties';
    return p === 'expo-build-properties';
  });
  const existingProps =
    Array.isArray(existingPlugin) && typeof existingPlugin[1] === 'object' && existingPlugin[1] !== null
      ? existingPlugin[1]
      : {};

  const plugins = (config.plugins || []).filter((p) => {
    if (typeof p === 'string') return p !== 'expo-build-properties';
    if (Array.isArray(p)) return p[0] !== 'expo-build-properties';
    return true;
  });

  plugins.push([
    'expo-build-properties',
    {
      ...existingProps,
      android: {
        ...(existingProps.android || {}),
        buildArchs,
        enableMinifyInReleaseBuilds: true,
        enableShrinkResourcesInReleaseBuilds: true,
      },
    },
  ]);

  return {
    ...config,
    plugins,
  };
};

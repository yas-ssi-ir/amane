module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      // Transforme `import.meta.env.X` en `process.env.X` au build
      // (Metro web ne supporte pas import.meta nativement, donc certaines
      // libs comme zustand v5 plantent. Ce plugin patche tout d'un coup.)
      'babel-plugin-transform-vite-meta-env',

      // Worklets DOIT etre le dernier plugin
      'react-native-worklets/plugin',
    ],
  };
};

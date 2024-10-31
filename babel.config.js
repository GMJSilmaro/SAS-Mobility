module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module:react-native-dotenv', {
        moduleName: '@env',
        path: '.env',
        blacklist: null,
        whitelist: null,
        safe: false,
        allowUndefined: true
      }],
      'react-native-reanimated/plugin',
      ["module-resolver", {
        "root": ["./"],
        "extensions": [
          ".ios.ts",
          ".android.ts",
          ".ts",
          ".ios.tsx",
          ".android.tsx",
          ".tsx",
          ".jsx",
          ".js",
          ".json"
        ],
        "alias": {
          "@": "./",
          "@components": "./components",
          "@screens": "./screens",
          "@assets": "./assets",
          "@constants": "./constants",
          "@navigation": "./navigation",
          "@utils": "./utils",
          "@data": "./data",
          "@styles": "./styles",
          "@tabs": "./tabs"
        }
      }]
    ]
  };
};
// module.exports = function(api) {
//   api.cache(true);
//   return {
//     presets: ['babel-preset-expo'],
//   };
// };

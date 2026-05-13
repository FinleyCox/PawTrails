const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// 1. Firebase: @firebase/auth (RN CJS) と firebase/app (ESM) が異なる
//    @firebase/app インスタンスを持つため "component auth has not been registered yet"
//    になる。全 @firebase/* 内部パッケージを CJS に統一して同一インスタンスにする。
//
// 2. expo-crypto: expo-auth-session@55 が expo-crypto@55 をネスト持ちしているが、
//    APK にリンクされているのは top-level の expo-crypto@13 のみ。
//    ネスト版を読み込むと ExpoCryptoAES ネイティブモジュールが見つからずクラッシュ。
//    expo-crypto を常に top-level バージョンに固定する。

const FORCE_CJS = {
  "@firebase/app": "node_modules/@firebase/app/dist/index.cjs.js",
  "@firebase/component": "node_modules/@firebase/component/dist/index.cjs.js",
  "@firebase/logger": "node_modules/@firebase/logger/dist/index.cjs.js",
  "@firebase/util": "node_modules/@firebase/util/dist/index.cjs.js",
  "@firebase/storage": "node_modules/@firebase/storage/dist/index.cjs.js",
};

const FORCE_TOPLEVEL = {
  "expo-crypto": "node_modules/expo-crypto/build/Crypto.js",
};

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const cjsOverride = FORCE_CJS[moduleName];
  if (cjsOverride) {
    return {
      filePath: path.resolve(__dirname, cjsOverride),
      type: "sourceFile",
    };
  }
  const topLevelOverride = FORCE_TOPLEVEL[moduleName];
  if (topLevelOverride) {
    return {
      filePath: path.resolve(__dirname, topLevelOverride),
      type: "sourceFile",
    };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

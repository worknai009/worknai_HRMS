// craco.config.js
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // ✅ 1) face-api.js ke missing TS sourcemap warnings ko stop karo
      webpackConfig.module.rules.forEach((rule) => {
        // CRA me source-map-loader usually "enforce: pre" hota hai
        const isSourceMapLoader =
          rule &&
          rule.enforce === "pre" &&
          (
            (rule.loader && rule.loader.includes("source-map-loader")) ||
            (Array.isArray(rule.use) &&
              rule.use.some((u) =>
                typeof u === "string"
                  ? u.includes("source-map-loader")
                  : (u.loader || "").includes("source-map-loader")
              ))
          );

        if (isSourceMapLoader) {
          const prevExclude = rule.exclude
            ? Array.isArray(rule.exclude)
              ? rule.exclude
              : [rule.exclude]
            : [];
          rule.exclude = [...prevExclude, /node_modules[\\/](face-api\.js)/];
        }
      });

      // ✅ 2) CRA5 me node core polyfills removed hote hain, isliye fs warning aata hai
      webpackConfig.resolve.fallback = {
        ...(webpackConfig.resolve.fallback || {}),
        fs: false,
        path: false,
        os: false
      };

      // ✅ Extra safety: ignoreWarnings
      webpackConfig.ignoreWarnings = [
        ...(webpackConfig.ignoreWarnings || []),
        /Failed to parse source map.*face-api\.js/
      ];

      return webpackConfig;
    }
  }
};

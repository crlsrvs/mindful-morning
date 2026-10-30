const {
  withAppDelegate,
  withAndroidManifest,
  withAppBuildGradle,
} = require("expo/config-plugins");
module.exports = function (config) {
  config = withAndroidManifest(config, (c) => {
    const app = c.modResults.manifest.application[0];
    app.$["android:allowBackup"] = "false";
    app.$["android:fullBackupContent"] = "false";
    return c;
  });
  config = withAppBuildGradle(config, (c) => {
    const marker = "// mindful-morning release content gate";
    if (!c.modResults.contents.includes(marker))
      c.modResults.contents += `
${marker}
tasks.register("validateMorningReleaseContent", Exec) {
    workingDir rootProject.projectDir.parentFile
    commandLine "node", "scripts/release-gate.mjs"
}
tasks.configureEach { task ->
    if (task.name == "preReleaseBuild") task.dependsOn("validateMorningReleaseContent")
}
`;
    return c;
  });
  return withAppDelegate(config, (c) => {
    if (c.modResults.language !== "swift")
      throw new Error("Private storage requires Swift AppDelegate");
    const marker = "// mindful-morning: exclude private documents from backup";
    if (!c.modResults.contents.includes(marker)) {
      const anchor = "    let delegate = ReactNativeDelegate()";
      if (!c.modResults.contents.includes(anchor))
        throw new Error("Cannot install backup exclusion");
      c.modResults.contents = c.modResults.contents.replace(
        anchor,
        `${marker}\n    do {\n      var documents = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]\n      var values = URLResourceValues()\n      values.isExcludedFromBackup = true\n      try documents.setResourceValues(values)\n    } catch {\n      fatalError("Private storage backup exclusion unavailable")\n    }\n${anchor}`,
      );
    }
    return c;
  });
};

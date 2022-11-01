const { defineConfig } = require("cypress");
const allureWriter = require("@shelex/cypress-allure-plugin/writer");

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      allureWriter(on, config);
      return config;
    },
    baseUrl: "https://www.hioscar.com//",
  },
  defaultCommandTimeout: 15000,
  experimentalWebKitSupport: true,
  // retries: 2,
});

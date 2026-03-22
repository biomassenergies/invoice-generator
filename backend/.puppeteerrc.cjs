const { join } = require('path');

/**
 * Keep the browser binary inside node_modules so hosted builds can find it
 * even when the default home-directory cache is unavailable.
 */
module.exports = {
  cacheDirectory: join(__dirname, 'node_modules', '.puppeteer_cache')
};

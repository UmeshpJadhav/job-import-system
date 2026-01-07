require('dotenv').config();
const connection = require('./src/config/redis');

(async () => {
    try {
        console.log('Attempting to set Redis config...');
        await connection.config('SET', 'maxmemory-policy', 'noeviction');
        console.log('Successfully set maxmemory-policy to noeviction');
    } catch (err) {
        console.error('Failed to set Redis config via script:', err.message);
        console.log('This is expected on some managed Redis instances. You can ignore the warning if you cannot change it via the dashboard.');
    } finally {
        connection.disconnect();
    }
})();

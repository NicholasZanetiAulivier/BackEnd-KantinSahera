const cron = require('node-cron');
const db = require('../database/db');
const { logger } = require('../core/logger');

async function setStatus(status) {
    await db.connect().then(async (client) => {
        let clientref = client;
        await client.query(
            "UPDATE restaurant_datas SET value = $1 WHERE key = 'status'",
            [status]
        ).catch((err) => {
            logger.error({ err }, 'Cron job database manipulation errored!: ' + status);
            throw err;
        }).finally(() => {
            clientref.release();
        });
    });
}

async function openStoreTask(ctx) {
    await setStatus('open');
}

async function closeStoreTask(ctx) {
    await setStatus('closed');
}

const openTask = cron.schedule('0 8 * * 1-6', openStoreTask, { name: "openTask", timezone: "Asia/Jakarta" }); //Cron scheduled for minute 0, at 8, from days Mon-Sat
const closeTask = cron.schedule('0 17 * * 1-6', closeStoreTask, { name: "closeTask", timezone: "Asia/Jakarta" }); //Cron scheduled for minute 0, at 16, from days Mon-Sat

console.log("task created");
console.log(openTask.name);
console.log(closeTask.name);

//To implement live change, we can make a mini API to listen on an unused port (10999 (shouldnt be accessible from outside)). Destroy and create task accordingly when signal is given

function exitHandler() {
    console.log("Cron: destroying tasks");
    openTask.stop();
    openTask.destroy();
    closeTask.stop();
    closeTask.destroy();
    console.log("Exiting");
}

// do something when app is closing
process.on('exit', exitHandler);
process.on('SIGINT', () => { exitHandler; process.exit(0); });
process.on('uncaughtException', () => { exitHandler; process.exit(0); });
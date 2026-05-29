const { preAsymmetricSignToken, preAsymmetricSignTransaction, B2BGetToken, snap } = require('../utils/doku');

async function main() {
    const body = {
        hello: "world",
        two: 2,
        ob: {
            in: true
        }
    }

    const date = (new Date()).toISOString();
    // const timestamp = date.substring(0, 19) + "Z";
    const timestamp = date;
    // console.log(timestamp);
    await B2BGetToken(await preAsymmetricSignToken(timestamp), timestamp);
}

main();

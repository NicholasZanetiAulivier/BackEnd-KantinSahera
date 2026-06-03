const { preAsymmetricSignToken, preAsymmetricSignTransaction, B2BGetToken, snap, dokuCheckout } = require('../utils/doku');

async function main() {
    const body = {
        hello: "world",
        two: 2,
        ob: {
            in: true
        }
    }

    const date = (new Date()).toISOString();
    const timestamp = date.substring(0, 19) + "Z";
    // const timestamp = date;
    // await B2BGetToken(await preAsymmetricSignToken(timestamp), timestamp); //Successful

    const res = await dokuCheckout("order100", timestamp, 100000);
}

main();

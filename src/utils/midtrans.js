const MIDTRANS_TRANSACTION_STATUS = {
    capture: 'c',
    settlement: 's',
    pending: 'p',
    deny: 'd',
    cancel: '0',
    expire: 'x',
    failure: 'f',
    refund: 'r',
    partial_refund: '/',
    authorize: 'a'
};

module.exports = {
    MIDTRANS_TRANSACTION_STATUS
}
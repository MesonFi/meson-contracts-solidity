"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwapSigner = void 0;
const hash_1 = require("@ethersproject/hash");
const transactions_1 = require("@ethersproject/transactions");
const SwapRequest_1 = require("./SwapRequest");
class SwapSigner {
    constructor(mesonAddress, chainId) {
        this.domain = {
            name: 'Meson Fi',
            version: '1',
            chainId,
            verifyingContract: mesonAddress
        };
    }
    get chainId() {
        return this.domain.chainId;
    }
    get mesonAddress() {
        return this.domain.verifyingContract;
    }
    async signSwapRequest(swap, wallet) {
        const signature = await wallet._signTypedData(this.domain, SwapRequest_1.SWAP_REQUEST_TYPE, swap);
        return this._separateSignature(signature);
    }
    async signSwapRelease(swapId, wallet) {
        const signature = await wallet._signTypedData(this.domain, SwapRequest_1.SWAP_RELEASE_TYPE, { swapId });
        return this._separateSignature(signature);
    }
    _separateSignature(signature) {
        const r = '0x' + signature.substring(2, 66);
        const s = '0x' + signature.substring(66, 130);
        const v = parseInt(signature.substring(130, 132), 16);
        return [r, s, v];
    }
    getSwapId(swap) {
        return hash_1._TypedDataEncoder.hash(this.domain, SwapRequest_1.SWAP_REQUEST_TYPE, swap);
    }
    recoverFromRequestSignature(swap, [r, s, v]) {
        return (0, transactions_1.recoverAddress)(this.getSwapId(swap), { r, s, v }).toLowerCase();
    }
    recoverFromReleaseSignature(swapId, [r, s, v]) {
        const digest = hash_1._TypedDataEncoder.hash(this.domain, SwapRequest_1.SWAP_RELEASE_TYPE, { swapId });
        return (0, transactions_1.recoverAddress)(digest, { r, s, v }).toLowerCase();
    }
}
exports.SwapSigner = SwapSigner;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwapRequestWithSigner = void 0;
const SwapRequest_1 = require("./SwapRequest");
class SwapRequestWithSigner extends SwapRequest_1.SwapRequest {
    constructor(req, signer) {
        super(req);
        this.signer = signer;
        this.swapId = signer.getSwapId(req);
    }
    async signRequest(wallet) {
        return await this.signer.signSwapRequest(this, wallet);
    }
    async signRelease(wallet) {
        return await this.signer.signSwapRelease(this.swapId, wallet);
    }
    async exportRequest(wallet, initiator = wallet.address) {
        const signature = await this.signRequest(wallet);
        return {
            ...this.toObject(),
            swapId: this.swapId,
            initiator: initiator.toLowerCase(),
            chainId: this.signer.chainId,
            mesonAddress: this.signer.mesonAddress,
            signature,
        };
    }
    async exportRelease(wallet, initiator = wallet.address) {
        const signature = await this.signRelease(wallet);
        return {
            swapId: this.swapId,
            initiator: initiator.toLowerCase(),
            chainId: this.signer.chainId,
            mesonAddress: this.signer.mesonAddress,
            signature,
        };
    }
    async serializeRequest(wallet) {
        return JSON.stringify(await this.exportRequest(wallet));
    }
    async serializeRelease(wallet) {
        return JSON.stringify(await this.exportRelease(wallet));
    }
}
exports.SwapRequestWithSigner = SwapRequestWithSigner;

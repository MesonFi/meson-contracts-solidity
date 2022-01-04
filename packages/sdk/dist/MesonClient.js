"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MesonClient = void 0;
const SwapSigner_1 = require("./SwapSigner");
const SwapRequestWithSigner_1 = require("./SwapRequestWithSigner");
class MesonClient {
    constructor(mesonInstance, chainId, coinType) {
        this.mesonInstance = mesonInstance;
        this.chainId = chainId;
        this.coinType = coinType;
        this.signer = new SwapSigner_1.SwapSigner(mesonInstance.address, chainId);
    }
    static async Create(mesonInstance) {
        const network = await mesonInstance.provider.getNetwork();
        const coinType = await mesonInstance.getCoinType();
        return new MesonClient(mesonInstance, Number(network.chainId), coinType);
    }
    requestSwap(outChain, swap, lockPeriod = 5400) {
        return new SwapRequestWithSigner_1.SwapRequestWithSigner({
            ...swap,
            inChain: this.coinType,
            outChain,
            expireTs: Math.floor(Date.now() / 1000) + lockPeriod,
        }, this.signer);
    }
    _check(swap) {
        if (this.chainId !== swap.chainId) {
            throw new Error('Mismatch chain id');
        }
        else if (this.mesonInstance.address !== swap.mesonAddress) {
            throw new Error('Mismatch messon address');
        }
    }
    async postSwap(signedRequest) {
        this._check(signedRequest);
        return this.mesonInstance.postSwap(signedRequest.encode(), signedRequest.inToken, signedRequest.initiator, ...signedRequest.signature);
    }
    async executeSwap(signedRelease) {
        this._check(signedRelease);
        return this.mesonInstance.executeSwap(signedRelease.swapId, ...signedRelease.signature);
    }
}
exports.MesonClient = MesonClient;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignedSwapRequest = void 0;
const SwapSigner_1 = require("./SwapSigner");
const SwapRequest_1 = require("./SwapRequest");
class SignedSwapRequest extends SwapRequest_1.SwapRequest {
    constructor(signedReq) {
        if (!signedReq.chainId) {
            throw new Error('Missing chain id');
        }
        else if (!signedReq.mesonAddress) {
            throw new Error('Missing meson contract address');
        }
        else if (!signedReq.initiator) {
            throw new Error('Missing initiator');
        }
        else if (!signedReq.signature) {
            throw new Error('Missing signature');
        }
        const signer = new SwapSigner_1.SwapSigner(signedReq.mesonAddress, Number(signedReq.chainId));
        const recovered = signer.recoverFromRequestSignature(signedReq, signedReq.signature);
        if (recovered !== signedReq.initiator) {
            throw new Error('Invalid signature');
        }
        super(signedReq);
        this.signer = signer;
        this.swapId = signer.getSwapId(this);
        this.chainId = signedReq.chainId;
        this.mesonAddress = signedReq.mesonAddress;
        this.initiator = signedReq.initiator;
        this.signature = signedReq.signature;
    }
    static FromSerialized(json) {
        let parsed;
        try {
            parsed = JSON.parse(json);
        }
        catch (_a) {
            throw new Error('Invalid json string');
        }
        return new SignedSwapRequest(parsed);
    }
    static CheckReleaseSignature(signedRelease) {
        const signer = new SwapSigner_1.SwapSigner(signedRelease.mesonAddress, Number(signedRelease.chainId));
        const recovered = signer.recoverFromReleaseSignature(signedRelease.swapId, signedRelease.signature);
        if (recovered !== signedRelease.initiator) {
            throw new Error('Invalid signature');
        }
    }
}
exports.SignedSwapRequest = SignedSwapRequest;

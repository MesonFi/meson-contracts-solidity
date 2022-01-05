"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwapRequest = exports.SWAP_RELEASE_TYPE = exports.SWAP_REQUEST_TYPE = void 0;
const hash_1 = require("@ethersproject/hash");
exports.SWAP_REQUEST_TYPE = {
    SwapRequest: [
        { name: 'expireTs', type: 'uint256' },
        { name: 'inToken', type: 'bytes' },
        { name: 'amount', type: 'uint256' },
        { name: 'outChain', type: 'bytes4' },
        { name: 'outToken', type: 'bytes' },
        { name: 'recipient', type: 'bytes' },
    ]
};
exports.SWAP_RELEASE_TYPE = {
    SwapRelease: [{ name: 'swapId', type: 'bytes32' }]
};
class SwapRequest {
    constructor(req) {
        this._encoded = '';
        this.expireTs = req.expireTs;
        this.inChain = req.inChain;
        this.inToken = req.inToken;
        this.amount = req.amount;
        this.outChain = req.outChain;
        this.outToken = req.outToken;
        this.recipient = req.recipient;
    }
    encode() {
        if (!this._encoded) {
            this._encoded = hash_1._TypedDataEncoder.from(exports.SWAP_REQUEST_TYPE).encode(this);
        }
        return this._encoded;
    }
    toObject() {
        return {
            expireTs: this.expireTs,
            inChain: this.inChain,
            inToken: this.inToken,
            amount: this.amount,
            outChain: this.outChain,
            outToken: this.outToken,
            recipient: this.recipient,
        };
    }
    serialize() {
        return JSON.stringify(this.toObject());
    }
}
exports.SwapRequest = SwapRequest;

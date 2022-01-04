import { BytesLike } from '@ethersproject/bytes';
export declare const SWAP_REQUEST_TYPE: {
    SwapRequest: {
        name: string;
        type: string;
    }[];
};
export declare const SWAP_RELEASE_TYPE: {
    SwapRelease: {
        name: string;
        type: string;
    }[];
};
export interface SwapRequestData {
    expireTs: number;
    inChain: BytesLike;
    inToken: BytesLike;
    amount: string;
    outChain: BytesLike;
    outToken: BytesLike;
    recipient: BytesLike;
}
export declare class SwapRequest implements SwapRequestData {
    readonly expireTs: number;
    readonly inChain: BytesLike;
    readonly inToken: BytesLike;
    readonly amount: string;
    readonly outChain: BytesLike;
    readonly outToken: BytesLike;
    readonly recipient: BytesLike;
    private _encoded;
    constructor(req: SwapRequestData);
    encode(): BytesLike;
    toObject(): {
        expireTs: number;
        inChain: BytesLike;
        inToken: BytesLike;
        amount: string;
        outChain: BytesLike;
        outToken: BytesLike;
        recipient: BytesLike;
    };
    serialize(): string;
}

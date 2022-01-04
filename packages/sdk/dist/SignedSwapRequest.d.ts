import { BytesLike } from '@ethersproject/bytes';
import { SwapSigner } from './SwapSigner';
import { SwapRequest, SwapRequestData } from './SwapRequest';
export interface SignedSwapCommonData {
    initiator: BytesLike;
    chainId: number;
    mesonAddress: string;
    signature: [string, string, number];
}
export interface SignedSwapRequestData extends SwapRequestData, SignedSwapCommonData {
}
export interface SignedSwapReleaseData extends SignedSwapCommonData {
    swapId: string;
}
export declare class SignedSwapRequest extends SwapRequest {
    readonly signer: SwapSigner;
    readonly swapId: string;
    readonly chainId: number;
    readonly mesonAddress: string;
    readonly initiator: BytesLike;
    readonly signature: [string, string, number];
    static FromSerialized(json: string): SignedSwapRequest;
    constructor(signedReq: SignedSwapRequestData);
    static CheckReleaseSignature(signedRelease: any): void;
}

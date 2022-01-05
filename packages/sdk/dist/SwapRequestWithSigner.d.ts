import { Wallet } from '@ethersproject/wallet';
import { SwapSigner } from './SwapSigner';
import { SwapRequest, SwapRequestData } from './SwapRequest';
import { SignedSwapRequestData, SignedSwapReleaseData } from './SignedSwapRequest';
export declare class SwapRequestWithSigner extends SwapRequest {
    readonly signer: SwapSigner;
    readonly swapId: string;
    constructor(req: SwapRequestData, signer: SwapSigner);
    signRequest(wallet: Wallet): Promise<[string, string, number]>;
    signRelease(wallet: Wallet): Promise<[string, string, number]>;
    exportRequest(wallet: Wallet): Promise<SignedSwapRequestData>;
    exportRelease(wallet: Wallet): Promise<SignedSwapReleaseData>;
    serializeRequest(wallet: Wallet): Promise<string>;
    serializeRelease(wallet: Wallet): Promise<string>;
}

import { Wallet } from '@ethersproject/wallet';
import { BytesLike } from '@ethersproject/bytes';
import { TypedDataDomain } from '@ethersproject/abstract-signer';
import { SwapRequestData } from './SwapRequest';
export declare class SwapSigner {
    readonly domain: TypedDataDomain;
    constructor(mesonAddress: string, chainId: number);
    get chainId(): import("@ethersproject/bignumber").BigNumberish | undefined;
    get mesonAddress(): string | undefined;
    signSwapRequest(swap: SwapRequestData, wallet: Wallet): Promise<[string, string, number]>;
    signSwapRelease(swapId: string, wallet: Wallet): Promise<[string, string, number]>;
    private _separateSignature;
    getSwapId(swap: SwapRequestData): string;
    recoverFromRequestSignature(swap: SwapRequestData, [r, s, v]: [string, string, number]): string;
    recoverFromReleaseSignature(swapId: BytesLike, [r, s, v]: [string, string, number]): string;
}

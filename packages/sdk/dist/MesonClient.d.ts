import { Contract } from '@ethersproject/contracts';
import { BytesLike } from '@ethersproject/bytes';
import { SwapSigner } from './SwapSigner';
import { SwapRequestWithSigner } from './SwapRequestWithSigner';
import { SignedSwapRequest, SignedSwapReleaseData } from './SignedSwapRequest';
export interface PartialSwapRequest {
    inToken: BytesLike;
    amount: string;
    outToken: BytesLike;
    recipient: BytesLike;
}
export declare class MesonClient {
    readonly mesonInstance: Contract;
    readonly chainId: number;
    readonly coinType: BytesLike;
    readonly signer: SwapSigner;
    static Create(mesonInstance: Contract): Promise<MesonClient>;
    constructor(mesonInstance: Contract, chainId: number, coinType: BytesLike);
    requestSwap(outChain: BytesLike, swap: PartialSwapRequest, lockPeriod?: number): SwapRequestWithSigner;
    private _check;
    postSwap(signedRequest: SignedSwapRequest): Promise<any>;
    executeSwap(signedRelease: SignedSwapReleaseData): Promise<any>;
}

import { Contract as EthersContract } from '@ethersproject/contracts';
import { MesonClient } from '@meson/sdk';
export default class MesonPresets {
    private _useTestnet;
    private _cache;
    constructor();
    useTestnet(v: any): void;
    getAllNetworks(): ({
        id: string;
        name: string;
        chainId: string;
        slip44: string;
        addressFormat: string;
        mesonAddress: string;
        tokens: {
            addr: string;
            name: string;
            symbol: string;
        }[];
        url?: undefined;
        explorer?: undefined;
    } | {
        id: string;
        name: string;
        chainId: string;
        slip44: string;
        addressFormat: string;
        url: string;
        explorer: string;
        mesonAddress: string;
        tokens: {
            addr: string;
            name: string;
            symbol: string;
        }[];
    } | {
        id: string;
        name: string;
        chainId: string;
        slip44: string;
        addressFormat: string;
        url: string;
        mesonAddress: string;
        tokens: {
            addr: string;
            name: string;
            symbol: string;
        }[];
        explorer?: undefined;
    } | {
        id: string;
        name: string;
        slip44: string;
        addressFormat: string;
        mesonAddress: string;
        tokens: any[];
        chainId?: undefined;
        url?: undefined;
        explorer?: undefined;
    })[];
    getNetwork(id: any): {
        id: string;
        name: string;
        chainId: string;
        slip44: string;
        addressFormat: string;
        mesonAddress: string;
        tokens: {
            addr: string;
            name: string;
            symbol: string;
        }[];
        url?: undefined;
        explorer?: undefined;
    } | {
        id: string;
        name: string;
        chainId: string;
        slip44: string;
        addressFormat: string;
        url: string;
        explorer: string;
        mesonAddress: string;
        tokens: {
            addr: string;
            name: string;
            symbol: string;
        }[];
    } | {
        id: string;
        name: string;
        chainId: string;
        slip44: string;
        addressFormat: string;
        url: string;
        mesonAddress: string;
        tokens: {
            addr: string;
            name: string;
            symbol: string;
        }[];
        explorer?: undefined;
    } | {
        id: string;
        name: string;
        slip44: string;
        addressFormat: string;
        mesonAddress: string;
        tokens: any[];
        chainId?: undefined;
        url?: undefined;
        explorer?: undefined;
    };
    getTokensForNetwork(id: any): any[];
    getClient(id: any, Contract?: typeof EthersContract): MesonClient;
}

import { Contract as EthersContract } from '@ethersproject/contracts';
import { MesonClient } from '@meson/sdk';
export default class PresetClients {
    private _cache;
    constructor();
    getClient(id: any, Contract?: typeof EthersContract): MesonClient;
}

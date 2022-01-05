import { MesonClient } from '@meson/sdk';
declare class Presets {
    private _cache;
    constructor();
    getClient(id: any): MesonClient;
}
declare const _default: Presets;
export default _default;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const contracts_1 = require("@ethersproject/contracts");
const sdk_1 = require("@meson/sdk");
const contract_abis_1 = require("@meson/contract-abis");
const mainnets_json_1 = __importDefault(require("./mainnets.json"));
const testnets_json_1 = __importDefault(require("./testnets.json"));
class MesonPresets {
    constructor() {
        this._useTestnet = false;
        this._cache = new Map();
    }
    useTestnet(v) {
        this._useTestnet = v;
    }
    getAllNetworks() {
        return this._useTestnet ? testnets_json_1.default : mainnets_json_1.default;
    }
    getNetwork(id) {
        const presets = this.getAllNetworks();
        return presets.find(item => item.id === id);
    }
    getTokensForNetwork(id) {
        const presets = this.getAllNetworks();
        const match = presets.find(item => item.id === id);
        return (match === null || match === void 0 ? void 0 : match.tokens) || [];
    }
    getClient(id, Contract = contracts_1.Contract) {
        const network = this.getNetwork(id);
        if (!network) {
            console.warn(`Unsupported network: ${id}`);
            return;
        }
        if (!this._cache.get(id)) {
            const instance = new Contract(network.mesonAddress, contract_abis_1.Meson.abi);
            const client = new sdk_1.MesonClient(instance, Number(network.chainId), network.slip44);
            this._cache.set(id, client);
        }
        return this._cache.get(id);
    }
}
exports.default = MesonPresets;

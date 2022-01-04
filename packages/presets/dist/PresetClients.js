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
const presets = [...mainnets_json_1.default, ...testnets_json_1.default];
class PresetClients {
    constructor() {
        this._cache = new Map();
    }
    getClient(id, Contract = contracts_1.Contract) {
        const match = presets.find(item => item.id === id);
        if (!match) {
            console.warn(`Unsupported network: ${id}`);
            return;
        }
        if (!this._cache.get(id)) {
            const instance = new Contract(match.mesonAddress, contract_abis_1.Meson.abi);
            const client = new sdk_1.MesonClient(instance, Number(match.chainId), match.slip44);
            this._cache.set(id, client);
        }
        return this._cache.get(id);
    }
}
exports.default = PresetClients;

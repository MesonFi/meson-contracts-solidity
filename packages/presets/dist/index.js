"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const sdk_1 = require("@meson/sdk");
const contract_abis_1 = require("@meson/contract-abis");
const presets_json_1 = __importDefault(require("./presets.json"));
class Presets {
    constructor() {
        this._cache = new Map();
    }
    getClient(id) {
        const match = presets_json_1.default.find(item => item.id === id);
        if (!match) {
            console.warn(`Unsupported network: ${id}`);
            return;
        }
        if (!this._cache.get(id)) {
            const instance = new ethers_1.Contract(match.mesonAddress, contract_abis_1.Meson.abi);
            const client = new sdk_1.MesonClient(instance, Number(match.chainId), match.slip44);
            this._cache.set(id, client);
        }
        return this._cache.get(id);
    }
}
exports.default = new Presets();

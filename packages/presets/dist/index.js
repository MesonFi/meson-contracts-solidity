"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testnets = exports.mainnets = void 0;
const MesonPresets_1 = __importDefault(require("./MesonPresets"));
var mainnets_json_1 = require("./mainnets.json");
Object.defineProperty(exports, "mainnets", { enumerable: true, get: function () { return __importDefault(mainnets_json_1).default; } });
var testnets_json_1 = require("./testnets.json");
Object.defineProperty(exports, "testnets", { enumerable: true, get: function () { return __importDefault(testnets_json_1).default; } });
exports.default = new MesonPresets_1.default();

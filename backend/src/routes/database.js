"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/database.ts
const express_1 = require("express");
const database_1 = __importDefault(require("../lib/database"));
const router = (0, express_1.Router)();
// Health check endpoint
router.get('/health', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const isHealthy = yield database_1.default.healthCheck();
        if (isHealthy) {
            res.json({
                status: 'healthy',
                database: 'connected',
                timestamp: new Date().toISOString()
            });
        }
        else {
            res.status(500).json({
                status: 'unhealthy',
                database: 'disconnected',
                timestamp: new Date().toISOString()
            });
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            status: 'error',
            database: 'error',
            error: errorMessage,
            timestamp: new Date().toISOString()
        });
    }
}));
// Data summary endpoint
router.get('/summary', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const summary = yield database_1.default.getDataSummary();
        res.json({
            status: 'success',
            data: summary,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            status: 'error',
            error: errorMessage,
            timestamp: new Date().toISOString()
        });
    }
}));
exports.default = router;

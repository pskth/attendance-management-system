"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/admin.ts
const express_1 = require("express");
const index_1 = __importDefault(require("./admin/index"));
const router = (0, express_1.Router)();
console.log('=== ADMIN ROUTES LOADED (MODULAR VERSION) ===');
// Mount all admin routes
router.use('/', index_1.default);
exports.default = router;

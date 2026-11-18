"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.impactRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const impact_service_1 = require("../services/impact.service");
const service = new impact_service_1.ImpactService();
exports.impactRoutes = (0, express_1.Router)();
exports.impactRoutes.use(auth_1.authenticate);
exports.impactRoutes.get('/', (0, validate_1.asyncHandler)(async (req, res) => {
    const impact = await service.get(req.user);
    res.json({ impact });
}));
//# sourceMappingURL=impact.routes.js.map
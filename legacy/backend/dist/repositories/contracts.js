"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toProfile = toProfile;
function toProfile(user) {
    const { passwordHash: _passwordHash, ...profile } = user;
    return profile;
}
//# sourceMappingURL=contracts.js.map
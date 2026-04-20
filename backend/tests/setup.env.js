// Variables obligatorias ANTES de que `config/env.js` valide.
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_unit_testing_only';
process.env.NODE_ENV = 'test';

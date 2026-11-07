import * as dotenv from 'dotenv';
import * as path from 'path';
import Joi from 'joi';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

interface EnvVars {
    PORT: number;
    NODE_ENV: 'development' | 'production' | 'test';
    SQL_HOST: string;
    SQL_PORT: number;
    SQL_USER: string;
    SQL_PASSWORD: string;
    SQL_DATABASE: string;
    REDIS_URL: string;
    JWT_SECRET: string;
    STARTER_BALANCE: number;
}

const schema = Joi.object<EnvVars>({
    PORT: Joi.number().default(3300),
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    SQL_HOST: Joi.string().default('localhost'),
    SQL_PORT: Joi.number().default(5432),
    SQL_USER: Joi.string().default('user'),
    SQL_PASSWORD: Joi.string().default('password123'),
    SQL_DATABASE: Joi.string().default('pandora_db'),
    REDIS_URL: Joi.string().default('redis://localhost:6379'),
    JWT_SECRET: Joi.string().min(16).default('pandora_london_sovereign_jwt_secret_key_2026'),
    STARTER_BALANCE: Joi.number().default(25000),
}).unknown(true);

const { value, error } = schema.validate(process.env, { abortEarly: false });

if (error) {
    throw new Error(`Environment validation failed: ${error.message}`);
}

export const env = {
    port: value.PORT,
    nodeEnv: value.NODE_ENV,
    db: {
        host: value.SQL_HOST,
        port: value.SQL_PORT,
        user: value.SQL_USER,
        password: value.SQL_PASSWORD,
        database: value.SQL_DATABASE,
    },
    redisUrl: value.REDIS_URL,
    jwt: {
        secret: value.JWT_SECRET,
        expiresInSeconds: 7 * 24 * 60 * 60,
    },
    economy: {
        starterBalance: value.STARTER_BALANCE,
        cityStipendAmount: 1250,
        cityStipendCooldownSeconds: 45,
    },
};


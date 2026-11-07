import { DNextFunc, DRequest, DResponse, UnauthorizedException, verifyJWTwithHMAC } from '@dolphjs/dolph';
import { env } from '../configs/env.config';
import { PandoraJwtPayload } from '../interfaces/jwt-payload.interface';

export const authShield = (req: DRequest, _res: DResponse, next: DNextFunc): void => {
    try {
        const rawHeader = req.headers['authorization'];
        if (!rawHeader || Array.isArray(rawHeader)) {
            return next(new UnauthorizedException('Authorization token is required'));
        }

        const token = rawHeader.startsWith('Bearer ') ? rawHeader.slice('Bearer '.length).trim() : rawHeader.trim();
        if (!token) {
            return next(new UnauthorizedException('Authorization token is required'));
        }

        const payload = verifyJWTwithHMAC({
            token,
            secret: env.jwt.secret,
        }) as unknown as PandoraJwtPayload;

        req.payload = payload;
        next();
    } catch {
        next(new UnauthorizedException('Invalid or expired authentication token'));
    }
};


import { IPayload } from '@dolphjs/dolph';

export interface PandoraTokenInfo {
    email: string;
    username: string | null;
    isVerified: boolean;
}

export interface PandoraJwtPayload extends IPayload {
    sub: string;
    iat: number;
    exp: number;
    info: PandoraTokenInfo;
}


import {
    DBody,
    DPayload,
    DQuery,
    Get,
    Patch,
    Post,
    Route,
    Shield,
    UnShield,
} from '@dolphjs/dolph';
import { PandoraJwtPayload } from '../../shared/interfaces/jwt-payload.interface';
import { authShield } from '../../shared/shields/auth.shield';
import {
    CitizenQueryDto,
    LoginAccountDto,
    RegisterAccountDto,
    ResendOtpDto,
    SetUsernameDto,
    UpdateProfileDto,
    VerifyOtpDto,
} from './account.dto';
import { AccountService } from './account.service';

@Shield(authShield)
@Route('account')
export class AccountController {
    constructor(private readonly accountService?: AccountService) {}

    @Get('greet')
    @UnShield(authShield)
    async greet() {
        if (!this.accountService) {
            return { message: "you've reached the account endpoint." };
        }
        return this.accountService.greet();
    }

    @Post('register')
    @UnShield(authShield)
    async register(@DBody(RegisterAccountDto) body: RegisterAccountDto) {
        return this.accountService!.register(body);
    }

    @Post('verify-otp')
    @UnShield(authShield)
    async verifyOtp(@DBody(VerifyOtpDto) body: VerifyOtpDto) {
        return this.accountService!.verifyOtp(body);
    }

    @Post('resend-otp')
    @UnShield(authShield)
    async resendOtp(@DBody(ResendOtpDto) body: ResendOtpDto) {
        return this.accountService!.resendOtp(body);
    }

    @Post('login')
    @UnShield(authShield)
    async login(@DBody(LoginAccountDto) body: LoginAccountDto) {
        return this.accountService!.login(body);
    }

    @Patch('username')
    async setUsername(@DPayload() payload: PandoraJwtPayload, @DBody(SetUsernameDto) body: SetUsernameDto) {
        return this.accountService!.setUsername(payload.sub, body);
    }

    @Patch('profile')
    async updateProfile(@DPayload() payload: PandoraJwtPayload, @DBody(UpdateProfileDto) body: UpdateProfileDto) {
        return this.accountService!.updateProfile(payload.sub, body);
    }

    @Get('me')
    async getMe(@DPayload() payload: PandoraJwtPayload) {
        return this.accountService!.getProfile(payload.sub);
    }

    @Get('citizens')
    async listCitizens(@DQuery(CitizenQueryDto) query: CitizenQueryDto) {
        return this.accountService!.listCitizens(query?.search);
    }
}

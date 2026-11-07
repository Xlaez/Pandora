import request from 'supertest';
import { createDolphApp } from '../src/server';
import { getDataSource } from '@dolphjs/dolph';
import { Property } from '../src/components/world/property.entity';

describe('Pandora City Simulation E2E (DolphJS v3 + Fastify + PostgreSQL + Redis)', () => {
    const dolph = createDolphApp();
    let engine: ReturnType<typeof dolph.engine>;

    const emailA = `arthur_${Date.now()}@pandora.uk`;
    const emailB = `beatrice_${Date.now()}@pandora.uk`;
    const userA = `arthur_${Date.now().toString().slice(-5)}`;
    const userB = `beatrice_${Date.now().toString().slice(-5)}`;

    let tokenA = '';
    let tokenB = '';
    let otpCodeA = '';
    let otpCodeB = '';
    let purchasedHouseId = '';

    beforeAll(async () => {
        await dolph.ready();
        engine = dolph.engine();
    });

    afterAll(async () => {
        const ds = getDataSource();
        if (ds?.isInitialized && purchasedHouseId) {
            await ds
                .getRepository(Property)
                .update(
                    { id: purchasedHouseId },
                    { ownerId: null, ownerUsername: null, isForSale: true, isLocked: false },
                )
                .catch(() => undefined);
        }
        await dolph.stop();
        if (ds?.isInitialized) {
            await ds.destroy();
        }
    });

    it('1. Registers Citizen A and Citizen B and issues 6-digit OTPs', async () => {
        const resA = await request(engine)
            .post('/v1/account/register')
            .send({ email: emailA, password: 'Password123!' });

        expect(resA.status).toBe(200);
        expect(resA.body.success).toBe(true);
        expect(resA.body.data.requiresVerification).toBe(true);
        expect(resA.body.data.devOtpCode).toMatch(/^\d{6}$/);
        expect(resA.body.data.formattedSms).toContain(`#${resA.body.data.devOtpCode}`);
        otpCodeA = resA.body.data.devOtpCode;

        const resB = await request(engine)
            .post('/v1/account/register')
            .send({ email: emailB, password: 'Password123!' });

        expect(resB.status).toBe(200);
        otpCodeB = resB.body.data.devOtpCode;
    });

    it('2. Verifies 6-digit OTPs and returns JWT tokens', async () => {
        const verifyA = await request(engine)
            .post('/v1/account/verify-otp')
            .send({ email: emailA, code: otpCodeA });

        expect(verifyA.status).toBe(200);
        expect(verifyA.body.data.token).toBeDefined();
        expect(verifyA.body.data.needsUsername).toBe(true);
        tokenA = verifyA.body.data.token;

        const verifyB = await request(engine)
            .post('/v1/account/verify-otp')
            .send({ email: emailB, code: otpCodeB });

        expect(verifyB.status).toBe(200);
        tokenB = verifyB.body.data.token;
    });

    it('3. Sets unique @usernames and rejects duplicate usernames', async () => {
        const setA = await request(engine)
            .patch('/v1/account/username')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ username: userA, avatarColor: '#C0392B', hatStyle: 'tophat' });

        expect(setA.status).toBe(200);
        expect(setA.body.data.account.username).toBe(userA);
        tokenA = setA.body.data.token;

        const duplicateAttempt = await request(engine)
            .patch('/v1/account/username')
            .set('Authorization', `Bearer ${tokenB}`)
            .send({ username: userA });

        expect(duplicateAttempt.status).toBe(409);

        const setB = await request(engine)
            .patch('/v1/account/username')
            .set('Authorization', `Bearer ${tokenB}`)
            .send({ username: userB, avatarColor: '#1E8449', hatStyle: 'crown' });

        expect(setB.status).toBe(200);
        tokenB = setB.body.data.token;
    });

    it('4. Transfers money (£) between citizens and updates Royal Bank ledger', async () => {
        const transferRes = await request(engine)
            .post('/v1/economy/transfer')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({
                recipientUsername: userB,
                amount: 3500,
                note: 'Welcome to Kensington!',
                idempotencyKey: `e2e-tx-${Date.now()}`,
            });

        expect(transferRes.status).toBe(200);
        expect(transferRes.body.data.balance).toBe(21500);

        const ledgerB = await request(engine)
            .get('/v1/economy/ledger')
            .set('Authorization', `Bearer ${tokenB}`);

        expect(ledgerB.status).toBe(200);
        expect(ledgerB.body.data.balance).toBe(28500);
        expect(ledgerB.body.data.transactions.length).toBeGreaterThanOrEqual(1);
    });

    it('5. Lists Pandora houses, buys a house, enters it, and locks/unlocks doors', async () => {
        const listRes = await request(engine).get('/v1/properties');
        expect(listRes.status).toBe(200);
        expect(listRes.body.data.length).toBeGreaterThanOrEqual(10);

        const affordableHouse = listRes.body.data.find(
            (p: { isForSale: boolean; price: number }) => p.isForSale && p.price <= 20000,
        );
        expect(affordableHouse).toBeDefined();
        purchasedHouseId = affordableHouse.id;

        const buyRes = await request(engine)
            .post(`/v1/properties/${affordableHouse.id}/buy`)
            .set('Authorization', `Bearer ${tokenA}`);

        expect(buyRes.status).toBe(200);
        expect(buyRes.body.data.property.ownerUsername).toBe(userA);

        const lockRes = await request(engine)
            .patch(`/v1/properties/${affordableHouse.id}/settings`)
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ isLocked: true, interiorTheme: 'mayfair_marble' });

        expect(lockRes.status).toBe(200);
        expect(lockRes.body.data.isLocked).toBe(true);

        const blockedEnter = await request(engine)
            .post(`/v1/properties/${affordableHouse.id}/enter`)
            .set('Authorization', `Bearer ${tokenB}`);

        expect(blockedEnter.status).toBe(403);

        const ownerEnter = await request(engine)
            .post(`/v1/properties/${affordableHouse.id}/enter`)
            .set('Authorization', `Bearer ${tokenA}`);

        expect(ownerEnter.status).toBe(200);
        expect(ownerEnter.body.data.zoneId).toBe(`house:${affordableHouse.id}`);
    });

    it('6. Enters a Pandora store, purchases an item, and sends Cell Phone SMS messages', async () => {
        const purchaseRes = await request(engine)
            .post('/v1/stores/harrods-emporium/purchase')
            .set('Authorization', `Bearer ${tokenB}`)
            .send({ sku: 'royal-top-hat', quantity: 1 });

        expect(purchaseRes.status).toBe(200);
        expect(purchaseRes.body.data.hatStyle).toBe('tophat');

        const smsRes = await request(engine)
            .post('/v1/phone/messages')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ recipientUsername: userB, content: 'Meet me at the Crown & Anchor Pub!' });

        expect(smsRes.status).toBe(200);
        expect(smsRes.body.data.senderUsername).toBe(userA);

        const threadRes = await request(engine)
            .get(`/v1/phone/messages/${userA}`)
            .set('Authorization', `Bearer ${tokenB}`);

        expect(threadRes.status).toBe(200);
        expect(threadRes.body.data.length).toBe(1);
    });
});

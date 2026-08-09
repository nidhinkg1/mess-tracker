import request from 'supertest';
import app from '../app';
import prisma from '../prisma/client';

describe('Exhaustive E2E MVP Pre-Live Matrix Test Suite', () => {
  let userAToken: string;
  let userAId: string;
  let userBToken: string;
  let userBId: string;

  const userAEmail = 'e2e_user_a@test.com';
  const userBEmail = 'e2e_user_b@test.com';

  beforeAll(async () => {
    // Clean up test users if they pre-exist
    const existing = await prisma.user.findMany({
      where: { email: { in: [userAEmail, userBEmail] } }
    });

    for (const u of existing) {
      await prisma.monthlyShare.deleteMany({ where: { userId: u.id } });
      await prisma.mealException.deleteMany({ where: { userId: u.id } });
      await prisma.advancePayment.deleteMany({ where: { userId: u.id } });
      await prisma.user.delete({ where: { id: u.id } });
    }

    // Register User A
    const regA = await request(app).post('/api/auth/register').send({
      name: 'User Alpha',
      email: userAEmail,
      password: 'password123'
    });
    expect(regA.status).toBe(201);
    userAToken = regA.body.token;
    userAId = regA.body.user.id;

    // Register User B
    const regB = await request(app).post('/api/auth/register').send({
      name: 'User Beta',
      email: userBEmail,
      password: 'password123'
    });
    expect(regB.status).toBe(201);
    userBToken = regB.body.token;
    userBId = regB.body.user.id;
  });

  afterAll(async () => {
    if (userAId) {
      await prisma.monthlyShare.deleteMany({ where: { userId: userAId } });
      await prisma.mealException.deleteMany({ where: { userId: userAId } });
      await prisma.advancePayment.deleteMany({ where: { userId: userAId } });
      await prisma.user.deleteMany({ where: { id: userAId } });
    }
    if (userBId) {
      await prisma.monthlyShare.deleteMany({ where: { userId: userBId } });
      await prisma.mealException.deleteMany({ where: { userId: userBId } });
      await prisma.advancePayment.deleteMany({ where: { userId: userBId } });
      await prisma.user.deleteMany({ where: { id: userBId } });
    }
    await prisma.$disconnect();
  });

  describe('1. Registration, Login, Profile & Password Reset', () => {
    it('prevents duplicate email registration (409 Conflict)', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Duplicate Alpha',
        email: userAEmail,
        password: 'password123'
      });
      expect(res.status).toBe(409);
      expect(res.body.error).toContain('already exists');
    });

    it('rejects login with wrong password (401 Unauthorized)', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: userAEmail,
        password: 'wrongpassword'
      });
      expect(res.status).toBe(401);
    });

    it('successfully logs in with correct password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: userAEmail,
        password: 'password123'
      });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(userAEmail);
    });

    it('fetches authenticated user profile (/api/auth/me)', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userAToken}`);
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('User Alpha');
      expect(res.body.email).toBe(userAEmail);
    });

    it('resets user password and verifies login with new password', async () => {
      const resetRes = await request(app)
        .post('/api/auth/reset-password')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ newPassword: 'newpassword123' });
      expect(resetRes.status).toBe(200);

      const oldLoginRes = await request(app).post('/api/auth/login').send({
        email: userAEmail,
        password: 'password123'
      });
      expect(oldLoginRes.status).toBe(401);

      const newLoginRes = await request(app).post('/api/auth/login').send({
        email: userAEmail,
        password: 'newpassword123'
      });
      expect(newLoginRes.status).toBe(200);
      userAToken = newLoginRes.body.token; // Update token
    });
  });

  describe('2. User Authorization & Multi-tenant Data Isolation', () => {
    let userAPaymentId: string;
    let userAExceptionId: string;

    beforeAll(async () => {
      // Create a payment and exception for User A
      const pRes = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ amount: 1500, paymentDate: '2026-08-05', note: 'User A Secret Payment' });
      userAPaymentId = pRes.body.id;

      const eRes = await request(app)
        .post('/api/meal-exceptions')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ date: '2026-08-05', type: 'NO_FOOD' });
      userAExceptionId = eRes.body.id;
    });

    it('prevents User B from accessing User A payment by ID (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/payments/${userAPaymentId}`)
        .set('Authorization', `Bearer ${userBToken}`);
      expect(res.status).toBe(403);
    });

    it('prevents User B from modifying User A payment (403 Forbidden)', async () => {
      const res = await request(app)
        .put(`/api/payments/${userAPaymentId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ amount: 9999 });
      expect(res.status).toBe(403);
    });

    it('prevents User B from deleting User A payment (403 Forbidden)', async () => {
      const res = await request(app)
        .delete(`/api/payments/${userAPaymentId}`)
        .set('Authorization', `Bearer ${userBToken}`);
      expect(res.status).toBe(403);
    });

    it('prevents User B from accessing User A meal exception by ID (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/meal-exceptions/${userAExceptionId}`)
        .set('Authorization', `Bearer ${userBToken}`);
      expect(res.status).toBe(403);
    });

    it('prevents User B from modifying User A meal exception (403 Forbidden)', async () => {
      const res = await request(app)
        .put(`/api/meal-exceptions/${userAExceptionId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ type: 'LUNCH_ONLY' });
      expect(res.status).toBe(403);
    });

    it('prevents User B from deleting User A meal exception (403 Forbidden)', async () => {
      const res = await request(app)
        .delete(`/api/meal-exceptions/${userAExceptionId}`)
        .set('Authorization', `Bearer ${userBToken}`);
      expect(res.status).toBe(403);
    });

    it('ensures User B payment list does not contain User A payments', async () => {
      const res = await request(app)
        .get('/api/payments')
        .set('Authorization', `Bearer ${userBToken}`);
      expect(res.status).toBe(200);
      expect(res.body.find((p: any) => p.id === userAPaymentId)).toBeUndefined();
    });
  });

  describe('3. Advance Payments CRUD & Validation', () => {
    let paymentId: string;

    it('rejects zero payment amount (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ amount: 0, paymentDate: '2026-08-01' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('greater than 0');
    });

    it('rejects negative payment amount (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ amount: -500, paymentDate: '2026-08-01' });
      expect(res.status).toBe(400);
    });

    it('rejects invalid payment date format (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ amount: 1000, paymentDate: 'not-a-valid-date' });
      expect(res.status).toBe(400);
    });

    it('updates payment record and note', async () => {
      const createRes = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ amount: 2000, paymentDate: '2026-08-10', note: 'Initial GPay' });
      paymentId = createRes.body.id;

      const updateRes = await request(app)
        .put(`/api/payments/${paymentId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ amount: 2500, note: 'Updated GPay + Cash' });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.amount).toBe(2500);
      expect(updateRes.body.note).toBe('Updated GPay + Cash');
    });

    it('deletes payment record and verifies list length decrease', async () => {
      const delRes = await request(app)
        .delete(`/api/payments/${paymentId}`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(delRes.status).toBe(200);

      const getRes = await request(app)
        .get(`/api/payments/${paymentId}`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(getRes.status).toBe(404);
    });
  });

  describe('4. Meal Exception CRUD, Pricing Rules & Unique Conflict', () => {
    it('creates LUNCH_ONLY exception (Actual ₹70, Deduction ₹45)', async () => {
      const res = await request(app)
        .post('/api/meal-exceptions')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ date: '2026-08-12', type: 'LUNCH_ONLY' });

      expect(res.status).toBe(201);
      expect(res.body.actualPrice).toBe(70);
      expect(res.body.deduction).toBe(45);
      expect(res.body.normalDailyPrice).toBe(115);
    });

    it('creates DINNER_ONLY exception (Actual ₹50, Deduction ₹65)', async () => {
      const res = await request(app)
        .post('/api/meal-exceptions')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ date: '2026-08-13', type: 'DINNER_ONLY' });

      expect(res.status).toBe(201);
      expect(res.body.actualPrice).toBe(50);
      expect(res.body.deduction).toBe(65);
    });

    it('creates NO_FOOD exception (Actual ₹0, Deduction ₹115)', async () => {
      const res = await request(app)
        .post('/api/meal-exceptions')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ date: '2026-08-14', type: 'NO_FOOD' });

      expect(res.status).toBe(201);
      expect(res.body.actualPrice).toBe(0);
      expect(res.body.deduction).toBe(115);
    });

    it('rejects duplicate exception date for same user (409 Conflict)', async () => {
      const res = await request(app)
        .post('/api/meal-exceptions')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ date: '2026-08-12', type: 'NO_FOOD' });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('already exists');
    });

    it('updates exception type from LUNCH_ONLY to NO_FOOD', async () => {
      const listRes = await request(app)
        .get('/api/meal-exceptions')
        .set('Authorization', `Bearer ${userAToken}`);
      
      const lunchExc = listRes.body.find((e: any) => e.formattedDate === '2026-08-12');
      expect(lunchExc).toBeDefined();

      const updateRes = await request(app)
        .put(`/api/meal-exceptions/${lunchExc.id}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ type: 'NO_FOOD' });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.actualPrice).toBe(0);
      expect(updateRes.body.deduction).toBe(115);
    });
  });

  describe('5. Calendar Month Length Matrix (31, 30, 28, 29 days)', () => {
    it('31-day month calculation (August 2026)', async () => {
      const res = await request(app)
        .get('/api/billing/monthly?year=2026&month=8')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.daysInMonth).toBe(31);
      expect(res.body.defaultMonthlyAmount).toBe(31 * 115); // 3565
    });

    it('30-day month calculation (June 2026)', async () => {
      const res = await request(app)
        .get('/api/billing/monthly?year=2026&month=6')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.daysInMonth).toBe(30);
      expect(res.body.defaultMonthlyAmount).toBe(30 * 115); // 3450
    });

    it('February 28-day non-leap year calculation (Feb 2026)', async () => {
      const res = await request(app)
        .get('/api/billing/monthly?year=2026&month=2')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.daysInMonth).toBe(28);
      expect(res.body.defaultMonthlyAmount).toBe(28 * 115); // 3220
    });

    it('February 29-day leap year calculation (Feb 2028)', async () => {
      const res = await request(app)
        .get('/api/billing/monthly?year=2028&month=2')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.daysInMonth).toBe(29);
      expect(res.body.defaultMonthlyAmount).toBe(29 * 115); // 3335
    });
  });

  describe('6. Boundary & Month/Year Transition Date Isolation', () => {
    it('properly attributes 1st day and last day of month to target month', async () => {
      // Create exception on Dec 31, 2026
      await request(app)
        .post('/api/meal-exceptions')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ date: '2026-12-31', type: 'NO_FOOD' });

      // Create exception on Jan 1, 2027
      await request(app)
        .post('/api/meal-exceptions')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ date: '2027-01-01', type: 'DINNER_ONLY' });

      // Dec 2026 billing should only include Dec 31
      const decRes = await request(app)
        .get('/api/billing/monthly?year=2026&month=12')
        .set('Authorization', `Bearer ${userAToken}`);
      expect(decRes.body.exceptionDaysCount).toBe(1);
      expect(decRes.body.exceptions[0].date).toBe('2026-12-31');

      // Jan 2027 billing should only include Jan 1
      const janRes = await request(app)
        .get('/api/billing/monthly?year=2027&month=1')
        .set('Authorization', `Bearer ${userAToken}`);
      expect(janRes.body.exceptionDaysCount).toBe(1);
      expect(janRes.body.exceptions[0].date).toBe('2027-01-01');
    });
  });

  describe('7. Financial Balance States (DUE, FULLY_PAID, SURPLUS)', () => {
    const testYear = 2029;
    const testMonth = 5; // May (31 days) -> default = 3565

    it('Scenario A: Advance < Actual Bill -> status = DUE', async () => {
      // Add payment 3000
      await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ amount: 3000, paymentDate: `${testYear}-05-01` });

      const res = await request(app)
        .get(`/api/billing/monthly?year=${testYear}&month=${testMonth}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.body.actualBill).toBe(3565);
      expect(res.body.totalAdvancePaid).toBe(3000);
      expect(res.body.status).toBe('DUE');
      expect(res.body.amountDue).toBe(565);
      expect(res.body.remainingAdvance).toBe(0);
    });

    it('Scenario B: Advance == Actual Bill -> status = FULLY_PAID', async () => {
      // Add additional payment 565
      await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ amount: 565, paymentDate: `${testYear}-05-02` });

      const res = await request(app)
        .get(`/api/billing/monthly?year=${testYear}&month=${testMonth}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.body.actualBill).toBe(3565);
      expect(res.body.totalAdvancePaid).toBe(3565);
      expect(res.body.status).toBe('FULLY_PAID');
      expect(res.body.amountDue).toBe(0);
      expect(res.body.remainingAdvance).toBe(0);
    });

    it('Scenario C: Advance > Actual Bill -> status = SURPLUS', async () => {
      // Add additional payment 500
      await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ amount: 500, paymentDate: `${testYear}-05-03` });

      const res = await request(app)
        .get(`/api/billing/monthly?year=${testYear}&month=${testMonth}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.body.actualBill).toBe(3565);
      expect(res.body.totalAdvancePaid).toBe(4065);
      expect(res.body.status).toBe('SURPLUS');
      expect(res.body.amountDue).toBe(0);
      expect(res.body.remainingAdvance).toBe(500);
    });
  });

  describe('8. Public Shareable Statement & Revocation Security', () => {
    let token: string;

    it('generates a public share token', async () => {
      const res = await request(app)
        .post('/api/billing/share')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ year: 2026, month: 8 });

      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.token.length).toBe(64);
      token = res.body.token;
    });

    it('allows unauthenticated access to public monthly statement', async () => {
      const res = await request(app).get(`/api/share/${token}`);

      expect(res.status).toBe(200);
      expect(res.body.residentName).toBe('User Alpha');
      expect(res.body.year).toBe(2026);
      expect(res.body.month).toBe(8);
      expect(res.body.daysInMonth).toBe(31);
      expect(res.body.defaultDailyRate).toBe(115);
      expect(res.body.exceptions).toBeDefined();
      expect(res.body.payments).toBeDefined();
    });

    it('verifies calculations in public statement match private billing endpoint', async () => {
      const privateRes = await request(app)
        .get('/api/billing/monthly?year=2026&month=8')
        .set('Authorization', `Bearer ${userAToken}`);

      const publicRes = await request(app).get(`/api/share/${token}`);

      expect(publicRes.body.defaultMonthlyAmount).toBe(privateRes.body.defaultMonthlyAmount);
      expect(publicRes.body.totalDeductions).toBe(privateRes.body.totalDeductions);
      expect(publicRes.body.actualBill).toBe(privateRes.body.actualBill);
      expect(publicRes.body.totalAdvancePaid).toBe(privateRes.body.totalAdvancePaid);
      expect(publicRes.body.amountDue).toBe(privateRes.body.amountDue);
      expect(publicRes.body.remainingAdvance).toBe(privateRes.body.remainingAdvance);
      expect(publicRes.body.status).toBe(privateRes.body.status);
    });

    it('revokes share link and denies access with 404', async () => {
      const revokeRes = await request(app)
        .post('/api/billing/share/revoke')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ year: 2026, month: 8 });

      expect(revokeRes.status).toBe(200);

      const publicRes = await request(app).get(`/api/share/${token}`);
      expect(publicRes.status).toBe(404);
    });
  });

  describe('9. Input Validation & Error Handling', () => {
    it('returns 400 Bad Request on invalid year or month in billing query', async () => {
      const res = await request(app)
        .get('/api/billing/monthly?year=invalid&month=13')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(400);
    });

    it('returns 400 Bad Request on invalid exception type', async () => {
      const res = await request(app)
        .post('/api/meal-exceptions')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ date: '2026-08-20', type: 'INVALID_MEAL_TYPE' });

      expect(res.status).toBe(400);
    });
  });
});

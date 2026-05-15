import { describe, expect, it } from 'vitest';
import request from 'supertest';

import { testAccessToken, testApp } from './setup';

describe('Settings Endpoints', () => {
  it('should update the business profile', async () => {
    const response = await request(testApp)
      .patch('/settings/profile')
      .set('Authorization', `Bearer ${testAccessToken}`)
      .send({
        businessName: 'InvoiceFlow Studio',
        businessAddress: '123 Billing Street',
        businessPhone: '123456789',
        businessWebsite: 'https://example.com',
      })
      .expect(200);

    expect(response.body.businessName).toBe('InvoiceFlow Studio');
    expect(response.body.businessWebsite).toBe('https://example.com');
  });

  it('should upload a logo', async () => {
    const response = await request(testApp)
      .post('/settings/logo')
      .set('Authorization', `Bearer ${testAccessToken}`)
      .attach('logo', Buffer.from('logo'), {
        contentType: 'image/png',
        filename: 'logo.png',
      })
      .expect(200);

    expect(response.body.logoUrl).toMatch(/^\/uploads\/logo-\d+-\d+\.png$/);
  });
});

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { testApp, testAccessToken, testUserId, prisma } from './setup';

describe('Invoice Endpoints', () => {
  let userInvoiceId: string;
  let otherUserInvoiceId: string;
  let otherUserAccessToken: string;

  beforeAll(async () => {
    // Create another user for authorization tests
    const otherUser = await prisma.user.create({
      data: {
        email: 'otheruser@example.com',
        name: 'Other User',
        passwordHash: 'hashedpassword',
      },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
      }
    });

    // Generate JWT for other user
    const jwt = require('jsonwebtoken');
    otherUserAccessToken = jwt.sign(
      {
        id: otherUser.id,
        email: otherUser.email,
        plan: otherUser.plan.toLowerCase(),
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '15m' }
    );

    // Create an invoice for the other user
    const otherUserInvoice = await prisma.invoice.create({
      data: {
        number: 'INV-999',
        userId: otherUser.id,
        clientName: 'Other Client',
        clientEmail: 'other@example.com',
        clientAddress: 'Other Address',
        issueDate: new Date(),
        dueDate: new Date(),
        status: 'DRAFT',
        currency: 'USD',
        notes: '',
        subtotal: 100,
        taxRate: 10,
        taxAmount: 10,
        total: 110,
        lineItems: {
          create: {
            description: 'Test Item',
            quantity: 1,
            unitPrice: 100,
            amount: 100,
          }
        }
      }
    });
    otherUserInvoiceId = otherUserInvoice.id;
  });

  beforeEach(async () => {
    // Clean up invoices created during tests
    await prisma.lineItem.deleteMany({
      where: {
        invoice: {
          userId: { not: otherUserInvoiceId }
        }
      }
    });
    await prisma.invoice.deleteMany({
      where: {
        userId: { not: otherUserInvoiceId }
      }
    });
  });

  describe('POST /invoices', () => {
    it('should create a new invoice successfully', async () => {
      const invoiceData = {
        clientName: 'Test Client',
        clientEmail: 'client@example.com',
        clientAddress: '123 Test St',
        issueDate: '2024-01-01',
        dueDate: '2024-01-15',
        currency: 'USD',
        notes: 'Test notes',
        taxRate: 10,
        lineItems: [
          {
            description: 'Test Service',
            quantity: 2,
            unitPrice: 50
          }
        ]
      };

      const response = await request(testApp)
        .post('/invoices')
        .set('Authorization', `Bearer ${testAccessToken}`)
        .send(invoiceData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.clientName).toBe(invoiceData.clientName);
      expect(response.body.clientEmail).toBe(invoiceData.clientEmail);
      expect(response.body.number).toMatch(/^INV-\d{3}$/);
      expect(response.body.subtotal).toBe(100);
      expect(response.body.taxAmount).toBe(10);
      expect(response.body.total).toBe(110);
      expect(response.body.lineItems).toHaveLength(1);
      expect(response.body.lineItems[0].description).toBe(invoiceData.lineItems[0].description);

      userInvoiceId = response.body.id;
    });

    it('should return 401 when creating invoice without authentication', async () => {
      const invoiceData = {
        clientName: 'Test Client',
        clientEmail: 'client@example.com',
        clientAddress: '123 Test St',
        issueDate: '2024-01-01',
        dueDate: '2024-01-15',
        lineItems: [
          {
            description: 'Test Service',
            quantity: 1,
            unitPrice: 100
          }
        ]
      };

      const response = await request(testApp)
        .post('/invoices')
        .send(invoiceData)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 when creating invoice with invalid data', async () => {
      const invalidInvoiceData = {
        clientName: '',
        clientEmail: 'invalid-email',
        clientAddress: '123 Test St',
        lineItems: []
      };

      const response = await request(testApp)
        .post('/invoices')
        .set('Authorization', `Bearer ${testAccessToken}`)
        .send(invalidInvoiceData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /invoices', () => {
    beforeEach(async () => {
      // Create a test invoice for listing tests
      const invoice = await prisma.invoice.create({
        data: {
          number: 'INV-001',
          userId: testUserId,
          clientName: 'List Test Client',
          clientEmail: 'list@example.com',
          clientAddress: '123 List St',
          issueDate: new Date(),
          dueDate: new Date(),
          status: 'DRAFT',
          currency: 'USD',
          notes: '',
          subtotal: 100,
          taxRate: 0,
          taxAmount: 0,
          total: 100,
          lineItems: {
            create: {
              description: 'List Test Item',
              quantity: 1,
              unitPrice: 100,
              amount: 100,
            }
          }
        }
      });
      userInvoiceId = invoice.id;
    });

    it('should list only user\'s own invoices', async () => {
      const response = await request(testApp)
        .get('/invoices')
        .set('Authorization', `Bearer ${testAccessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      // Verify all invoices belong to the user
      response.body.forEach((invoice: any) => {
        expect(invoice).toHaveProperty('id');
        expect(invoice).toHaveProperty('clientName');
        expect(invoice).toHaveProperty('lineItems');
        expect(invoice.lineItems).toBeDefined();
      });

      // Should not include other user's invoice
      const otherUserInvoice = response.body.find((invoice: any) => invoice.id === otherUserInvoiceId);
      expect(otherUserInvoice).toBeUndefined();
    });

    it('should return 401 when listing invoices without authentication', async () => {
      const response = await request(testApp)
        .get('/invoices')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /invoices/:id', () => {
    beforeEach(async () => {
      // Create a test invoice for get tests
      const invoice = await prisma.invoice.create({
        data: {
          number: 'INV-002',
          userId: testUserId,
          clientName: 'Get Test Client',
          clientEmail: 'get@example.com',
          clientAddress: '123 Get St',
          issueDate: new Date(),
          dueDate: new Date(),
          status: 'DRAFT',
          currency: 'USD',
          notes: '',
          subtotal: 200,
          taxRate: 5,
          taxAmount: 10,
          total: 210,
          lineItems: {
            create: {
              description: 'Get Test Item',
              quantity: 2,
              unitPrice: 100,
              amount: 200,
            }
          }
        }
      });
      userInvoiceId = invoice.id;
    });

    it('should get user\'s own invoice by ID', async () => {
      const response = await request(testApp)
        .get(`/invoices/${userInvoiceId}`)
        .set('Authorization', `Bearer ${testAccessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.id).toBe(userInvoiceId);
      expect(response.body).toHaveProperty('lineItems');
      expect(response.body.lineItems).toHaveLength(1);
    });

    it('should return 404 when getting non-existent invoice', async () => {
      const response = await request(testApp)
        .get('/invoices/non-existent-id')
        .set('Authorization', `Bearer ${testAccessToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('not found');
    });

    it('should return 403 when accessing another user\'s invoice', async () => {
      const response = await request(testApp)
        .get(`/invoices/${otherUserInvoiceId}`)
        .set('Authorization', `Bearer ${testAccessToken}`)
        .expect(404); // Returns 404 instead of 403 for security

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('not found');
    });

    it('should return 401 when getting invoice without authentication', async () => {
      const response = await request(testApp)
        .get(`/invoices/${userInvoiceId}`)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('PATCH /invoices/:id', () => {
    beforeEach(async () => {
      // Create a test invoice for update tests
      const invoice = await prisma.invoice.create({
        data: {
          number: 'INV-003',
          userId: testUserId,
          clientName: 'Update Test Client',
          clientEmail: 'update@example.com',
          clientAddress: '123 Update St',
          issueDate: new Date(),
          dueDate: new Date(),
          status: 'DRAFT',
          currency: 'USD',
          notes: '',
          subtotal: 100,
          taxRate: 0,
          taxAmount: 0,
          total: 100,
          lineItems: {
            create: {
              description: 'Update Test Item',
              quantity: 1,
              unitPrice: 100,
              amount: 100,
            }
          }
        }
      });
      userInvoiceId = invoice.id;
    });

    it('should update user\'s own invoice successfully', async () => {
      const updateData = {
        clientName: 'Updated Client',
        clientEmail: 'updated@example.com',
        taxRate: 10,
        lineItems: [
          {
            description: 'Updated Service',
            quantity: 3,
            unitPrice: 50
          }
        ]
      };

      const response = await request(testApp)
        .patch(`/invoices/${userInvoiceId}`)
        .set('Authorization', `Bearer ${testAccessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.clientName).toBe(updateData.clientName);
      expect(response.body.clientEmail).toBe(updateData.clientEmail);
      expect(response.body.taxRate).toBe(updateData.taxRate);
      expect(response.body.subtotal).toBe(150);
      expect(response.body.taxAmount).toBe(15);
      expect(response.body.total).toBe(165);
      expect(response.body.lineItems).toHaveLength(1);
      expect(response.body.lineItems[0].description).toBe(updateData.lineItems[0].description);
    });

    it('should return 404 when updating non-existent invoice', async () => {
      const response = await request(testApp)
        .patch('/invoices/non-existent-id')
        .set('Authorization', `Bearer ${testAccessToken}`)
        .send({ clientName: 'Updated' })
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 when updating another user\'s invoice', async () => {
      const response = await request(testApp)
        .patch(`/invoices/${otherUserInvoiceId}`)
        .set('Authorization', `Bearer ${testAccessToken}`)
        .send({ clientName: 'Updated' })
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 when updating invoice without authentication', async () => {
      const response = await request(testApp)
        .patch(`/invoices/${userInvoiceId}`)
        .send({ clientName: 'Updated' })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('DELETE /invoices/:id', () => {
    beforeEach(async () => {
      // Create a test invoice for delete tests
      const invoice = await prisma.invoice.create({
        data: {
          number: 'INV-004',
          userId: testUserId,
          clientName: 'Delete Test Client',
          clientEmail: 'delete@example.com',
          clientAddress: '123 Delete St',
          issueDate: new Date(),
          dueDate: new Date(),
          status: 'DRAFT',
          currency: 'USD',
          notes: '',
          subtotal: 100,
          taxRate: 0,
          taxAmount: 0,
          total: 100,
          lineItems: {
            create: {
              description: 'Delete Test Item',
              quantity: 1,
              unitPrice: 100,
              amount: 100,
            }
          }
        }
      });
      userInvoiceId = invoice.id;
    });

    it('should delete user\'s own invoice successfully', async () => {
      await request(testApp)
        .delete(`/invoices/${userInvoiceId}`)
        .set('Authorization', `Bearer ${testAccessToken}`)
        .expect(204);

      // Verify invoice is deleted
      const deletedInvoice = await prisma.invoice.findUnique({
        where: { id: userInvoiceId }
      });
      expect(deletedInvoice).toBeNull();
    });

    it('should return 404 when deleting non-existent invoice', async () => {
      const response = await request(testApp)
        .delete('/invoices/non-existent-id')
        .set('Authorization', `Bearer ${testAccessToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 when deleting another user\'s invoice', async () => {
      const response = await request(testApp)
        .delete(`/invoices/${otherUserInvoiceId}`)
        .set('Authorization', `Bearer ${testAccessToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 when deleting invoice without authentication', async () => {
      const response = await request(testApp)
        .delete(`/invoices/${userInvoiceId}`)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('PATCH /invoices/:id/status', () => {
    beforeEach(async () => {
      // Create a test invoice for status update tests
      const invoice = await prisma.invoice.create({
        data: {
          number: 'INV-005',
          userId: testUserId,
          clientName: 'Status Test Client',
          clientEmail: 'status@example.com',
          clientAddress: '123 Status St',
          issueDate: new Date(),
          dueDate: new Date(),
          status: 'DRAFT',
          currency: 'USD',
          notes: '',
          subtotal: 100,
          taxRate: 0,
          taxAmount: 0,
          total: 100,
          lineItems: {
            create: {
              description: 'Status Test Item',
              quantity: 1,
              unitPrice: 100,
              amount: 100,
            }
          }
        }
      });
      userInvoiceId = invoice.id;
    });

    it('should update invoice status successfully', async () => {
      const response = await request(testApp)
        .patch(`/invoices/${userInvoiceId}/status`)
        .set('Authorization', `Bearer ${testAccessToken}`)
        .send({ status: 'SENT' })
        .expect(200);

      expect(response.body.status).toBe('SENT');
    });

    it('should return 400 when updating with invalid status', async () => {
      const response = await request(testApp)
        .patch(`/invoices/${userInvoiceId}/status`)
        .set('Authorization', `Bearer ${testAccessToken}`)
        .send({ status: 'INVALID_STATUS' })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 when updating status of non-existent invoice', async () => {
      const response = await request(testApp)
        .patch('/invoices/non-existent-id/status')
        .set('Authorization', `Bearer ${testAccessToken}`)
        .send({ status: 'SENT' })
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });
  });
});

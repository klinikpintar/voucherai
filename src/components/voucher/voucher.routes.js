import express from 'express';
import {
  createVoucher,
  listVouchers,
  redeemVoucher,
  updateVoucher,
  validateVoucher,
  getRedemptionHistory,
  deleteVoucher
} from './voucher.controller.js';
import { authenticateToken } from '../auth/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Voucher:
 *       type: object
 *       required:
 *         - name
 *         - code
 *         - discount
 *         - redemption
 *         - start_date
 *         - expiration_date
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Auto-generated voucher ID
 *         name:
 *           type: string
 *           description: Name of the voucher
 *         type:
 *           type: string
 *           enum: [DISCOUNT_VOUCHER]
 *           default: DISCOUNT_VOUCHER
 *           description: Type of the voucher
 *         code:
 *           type: string
 *           description: Unique voucher code
 *         discount:
 *           type: object
 *           required:
 *             - type
 *           properties:
 *             type:
 *               type: string
 *               enum: [AMOUNT, PERCENTAGE]
 *               description: Type of discount - AMOUNT for fixed amount, PERCENTAGE for percentage off
 *             amount_off:
 *               type: number
 *               description: Amount to discount (required if type is AMOUNT)
 *               example: 300
 *             percent_off:
 *               type: number
 *               minimum: 0
 *               maximum: 100
 *               description: Percentage to discount (required if type is PERCENTAGE)
 *               example: 25
 *             amount_limit:
 *               type: number
 *               minimum: 0
 *               description: Maximum discount amount (for percentage discounts)
 *               example: 500
 *             minAmount:
 *               type: number
 *               minimum: 0
 *               description: Minimum transaction amount required to use this voucher
 *               example: 1000
 *         redemption:
 *           type: object
 *           required:
 *             - quantity
 *           properties:
 *             quantity:
 *               type: integer
 *               minimum: 1
 *               description: Maximum number of times this voucher can be redeemed
 *             daily_quota:
 *               type: integer
 *               minimum: 1
 *               description: Maximum number of redemptions per day
 *         start_date:
 *           type: string
 *           format: date-time
 *           description: When the voucher becomes valid
 *         expiration_date:
 *           type: string
 *           format: date-time
 *           description: When the voucher expires
 *         active:
 *           type: boolean
 *           default: true
 *           description: Whether the voucher is active
 *         redeemedCount:
 *           type: integer
 *           default: 0
 *           description: Number of times this voucher has been redeemed
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       examples:
 *         amount_discount:
 *           value:
 *             name: "Fixed Amount Discount"
 *             type: "DISCOUNT_VOUCHER"
 *             code: "FIXED300"
 *             discount:
 *               type: "AMOUNT"
 *               amount_off: 300
 *               minAmount: 1000
 *             redemption:
 *               quantity: 33
 *               daily_quota: 3
 *             start_date: "2025-01-02T12:26:00+07:00"
 *             expiration_date: "2025-01-31T12:26:00+07:00"
 *             active: true
 *         percentage_discount:
 *           value:
 *             name: "25% Off Discount"
 *             type: "DISCOUNT_VOUCHER"
 *             code: "PERCENT25"
 *             discount:
 *               type: "PERCENTAGE"
 *               percent_off: 25
 *               amount_limit: 500
 *               minAmount: 1000
 *             redemption:
 *               quantity: 100
 *               daily_quota: 5
 *             start_date: "2025-01-02T12:26:00+07:00"
 *             expiration_date: "2025-01-31T12:26:00+07:00"
 *             active: true
 */

/**
 * @swagger
 * /api/v1/vouchers:
 *   post:
 *     summary: Create a new voucher
 *     description: |
 *       Create a new voucher with either fixed amount or percentage discount.
 *       
 *       For AMOUNT type discount:
 *       ```json
 *       {
 *         "name": "Fixed Amount Discount",
 *         "type": "DISCOUNT_VOUCHER",
 *         "code": "FIXED300",
 *         "discount": {
 *           "type": "AMOUNT",
 *           "amount_off": 300,
 *           "minAmount": 1000
 *         },
 *         "redemption": {
 *           "quantity": 33,
 *           "daily_quota": 3
 *         },
 *         "start_date": "2025-01-02T12:26:00+07:00",
 *         "expiration_date": "2025-01-31T12:26:00+07:00",
 *         "active": true
 *       }
 *       ```
 *       
 *       For PERCENTAGE type discount:
 *       ```json
 *       {
 *         "name": "25% Off Discount",
 *         "type": "DISCOUNT_VOUCHER",
 *         "code": "PERCENT25",
 *         "discount": {
 *           "type": "PERCENTAGE",
 *           "percent_off": 25,
 *           "amount_limit": 500,
 *           "minAmount": 1000
 *         },
 *         "redemption": {
 *           "quantity": 100,
 *           "daily_quota": 5
 *         },
 *         "start_date": "2025-01-02T12:26:00+07:00",
 *         "expiration_date": "2025-01-31T12:26:00+07:00",
 *         "active": true
 *       }
 *       ```
 *     tags: [Vouchers]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Voucher'
 *     responses:
 *       201:
 *         description: Voucher created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Voucher'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/', authenticateToken, createVoucher);

/**
 * @swagger
 * /api/v1/vouchers:
 *   get:
 *     summary: List all vouchers
 *     tags: [Vouchers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of vouchers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Voucher'
 *                 total:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 page:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', authenticateToken, listVouchers);

/**
 * @swagger
 * /api/v1/vouchers/redeem:
 *   post:
 *     summary: Redeem a voucher
 *     tags: [Vouchers]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Voucher redeemed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Voucher'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Voucher not found or expired
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/redeem', authenticateToken, redeemVoucher);

/**
 * @swagger
 * /api/v1/vouchers/{code}:
 *   put:
 *     summary: Update a voucher
 *     tags: [Vouchers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Voucher code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [DISCOUNT_VOUCHER]
 *               discount:
 *                 type: object
 *                 required:
 *                   - type
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [AMOUNT, PERCENTAGE]
 *                   amount_off:
 *                     type: number
 *                   percent_off:
 *                     type: number
 *                     minimum: 0
 *                     maximum: 100
 *                   amount_limit:
 *                     type: number
 *                     minimum: 0
 *                   minAmount:
 *                     type: number
 *                     minimum: 0
 *               redemption:
 *                 type: object
 *                 required:
 *                   - quantity
 *                 properties:
 *                   quantity:
 *                     type: integer
 *                     minimum: 1
 *                   daily_quota:
 *                     type: integer
 *                     minimum: 1
 *               start_date:
 *                 type: string
 *                 format: date-time
 *               expiration_date:
 *                 type: string
 *                 format: date-time
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Voucher updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Voucher'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Voucher not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:code', authenticateToken, updateVoucher);

/**
 * @swagger
 * /api/v1/vouchers/validate:
 *   post:
 *     summary: Validate a voucher
 *     tags: [Vouchers]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Voucher validation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                 voucher:
 *                   $ref: '#/components/schemas/Voucher'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Voucher not found or expired
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/validate', authenticateToken, validateVoucher);

/**
 * @swagger
 * /api/v1/vouchers/redemptions:
 *   get:
 *     summary: Get redemption history
 *     tags: [Vouchers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: voucherId
 *         schema:
 *           type: integer
 *         description: Filter by voucher ID
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *         description: Filter by customer ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Redemption history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 total:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 page:
 *                   type: integer
 */
router.get('/redemptions', authenticateToken, getRedemptionHistory);

/**
 * @swagger
 * /api/v1/vouchers/{code}:
 *   delete:
 *     summary: Delete a voucher
 *     tags: [Vouchers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Voucher code
 *     responses:
 *       200:
 *         description: Voucher deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Voucher'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Voucher not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:code', authenticateToken, deleteVoucher);

export default router;

import express from 'express';
import { createVoucher, getVouchers, getVoucherByCode, redeemVoucher, getRedemptionHistory, updateVoucher } from './voucher.controller.js';
import { authenticateToken } from '../auth/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     Discount:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           enum: [AMOUNT, PERCENTAGE]
 *         amount_off:
 *           type: number
 *           description: Amount off when type is AMOUNT
 *         percent_off:
 *           type: number
 *           description: Percentage off when type is PERCENTAGE
 *         amount_limit:
 *           type: number
 *           description: Maximum discount amount when type is PERCENTAGE
 *     Redemption:
 *       type: object
 *       properties:
 *         quantity:
 *           type: integer
 *           description: Maximum number of times this voucher can be redeemed
 *         daily_quota:
 *           type: integer
 *           description: Maximum number of redemptions allowed per day
 *         redeemed_count:
 *           type: integer
 *           description: Number of times this voucher has been redeemed
 *     VoucherResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         code:
 *           type: string
 *         discount:
 *           $ref: '#/components/schemas/Discount'
 *         redemption:
 *           $ref: '#/components/schemas/Redemption'
 *         start_date:
 *           type: string
 *           format: date-time
 *         expiration_date:
 *           type: string
 *           format: date-time
 *         is_active:
 *           type: boolean
 *         customer_id:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     RedemptionResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         voucher_id:
 *           type: integer
 *         customer_id:
 *           type: string
 *         discount_amount:
 *           type: number
 *         redeemed_at:
 *           type: string
 *           format: date-time
 *         metadata:
 *           type: object
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         voucher:
 *           type: object
 *           properties:
 *             code:
 *               type: string
 *             name:
 *               type: string
 *     PaginationResponse:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *         page:
 *           type: integer
 *         limit:
 *           type: integer
 *         total_pages:
 *           type: integer
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 */

/**
 * @swagger
 * /api/vouchers:
 *   post:
 *     summary: Create a new voucher
 *     tags: [Vouchers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *               - discount
 *               - redemption
 *               - start_date
 *               - expiration_date
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               discount:
 *                 $ref: '#/components/schemas/Discount'
 *               redemption:
 *                 type: object
 *                 properties:
 *                   quantity:
 *                     type: integer
 *                   daily_quota:
 *                     type: integer
 *               start_date:
 *                 type: string
 *                 format: date-time
 *               expiration_date:
 *                 type: string
 *                 format: date-time
 *               is_active:
 *                 type: boolean
 *               customer_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Voucher created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VoucherResponse'
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 *   get:
 *     summary: Get all vouchers
 *     tags: [Vouchers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: customer_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
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
 *                     $ref: '#/components/schemas/VoucherResponse'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/vouchers/{code}:
 *   get:
 *     summary: Get voucher by code
 *     tags: [Vouchers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Voucher details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VoucherResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Voucher not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     summary: Update a voucher
 *     description: Update an existing voucher. All fields are optional - only the provided fields will be updated.
 *     tags: [Vouchers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         description: Voucher code to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: New name for the voucher
 *               discount:
 *                 type: object
 *                 description: Discount details to update
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [AMOUNT, PERCENTAGE]
 *                   amount_off:
 *                     type: number
 *                     description: Required when type is AMOUNT
 *                   percent_off:
 *                     type: number
 *                     description: Required when type is PERCENTAGE
 *                   amount_limit:
 *                     type: number
 *                     description: Maximum discount amount for percentage discounts
 *               redemption:
 *                 type: object
 *                 description: Redemption rules to update
 *                 properties:
 *                   quantity:
 *                     type: integer
 *                     description: Maximum number of redemptions allowed
 *                   daily_quota:
 *                     type: integer
 *                     description: Maximum redemptions per day
 *               start_date:
 *                 type: string
 *                 format: date-time
 *                 description: New start date for the voucher
 *               expiration_date:
 *                 type: string
 *                 format: date-time
 *                 description: New expiration date for the voucher
 *               is_active:
 *                 type: boolean
 *                 description: Set voucher active status
 *               customer_id:
 *                 type: string
 *                 description: Update customer ID restriction
 *     responses:
 *       200:
 *         description: Voucher updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VoucherResponse'
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Voucher not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/vouchers/{code}/redeem:
 *   post:
 *     summary: Redeem a voucher
 *     tags: [Vouchers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customer_id
 *               - transaction_amount
 *             properties:
 *               customer_id:
 *                 type: string
 *               transaction_amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Voucher redeemed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 voucher_code:
 *                   type: string
 *                 discount_amount:
 *                   type: number
 *                 customer_id:
 *                   type: string
 *                 redeemed_at:
 *                   type: string
 *                   format: date-time
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid redemption request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/vouchers/redemptions:
 *   get:
 *     summary: Get redemption history
 *     tags: [Vouchers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: voucher_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: customer_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of redemptions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RedemptionResponse'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

router.post('/', authenticateToken, createVoucher);
router.get('/', authenticateToken, getVouchers);
router.get('/redemptions', authenticateToken, getRedemptionHistory);
router.get('/:code', authenticateToken, getVoucherByCode);
router.post('/:code/redeem', authenticateToken, redeemVoucher);
router.put('/:code', authenticateToken, updateVoucher);

export default router;

import express from 'express';
import {
  createVoucher,
  listVouchers,
  redeemVoucher,
  updateVoucher,
  validateVoucher,
  getRedemptionHistory
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
 *         - startDate
 *         - expirationDate
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Auto-generated voucher ID
 *         name:
 *           type: string
 *           description: Name of the voucher
 *         code:
 *           type: string
 *           description: Unique voucher code
 *         isActive:
 *           type: boolean
 *           default: true
 *         discount:
 *           type: object
 *           required:
 *             - type
 *           properties:
 *             type:
 *               type: string
 *               enum: [AMOUNT, PERCENTAGE]
 *             amountOff:
 *               type: number
 *               description: Required if type is AMOUNT
 *             percentOff:
 *               type: number
 *               description: Required if type is PERCENTAGE
 *         redemption:
 *           type: object
 *           required:
 *             - quantity
 *             - dailyQuota
 *           properties:
 *             quantity:
 *               type: integer
 *               minimum: 1
 *             dailyQuota:
 *               type: integer
 *               minimum: 1
 *         startDate:
 *           type: string
 *           format: date-time
 *         expirationDate:
 *           type: string
 *           format: date-time
 *         redeemedCount:
 *           type: integer
 *           default: 0
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/vouchers:
 *   post:
 *     summary: Create a new voucher
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
 *               isActive:
 *                 type: boolean
 *               discount:
 *                 $ref: '#/components/schemas/Voucher/properties/discount'
 *               redemption:
 *                 $ref: '#/components/schemas/Voucher/properties/redemption'
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               expirationDate:
 *                 type: string
 *                 format: date-time
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

export default router;

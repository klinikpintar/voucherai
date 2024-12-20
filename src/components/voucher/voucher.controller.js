import Voucher from './voucher.model.js';
import VoucherRedemption from './voucher-redemption.model.js';
import sequelize from '../../config/database.js';
import { Op } from 'sequelize';

export const createVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.create(req.body);
    res.status(201).json(voucher);
  } catch (error) {
    console.error('Create voucher error:', error);
    res.status(400).json({ error: 'Invalid voucher data' });
  }
};

export const listVouchers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const customerId = req.query.customerId;

    const where = {};
    if (customerId) {
      where.customerId = customerId;
    }

    const { count, rows } = await Voucher.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [{
        model: VoucherRedemption,
        attributes: ['id', 'customerId', 'redeemedAt', 'metadata']
      }]
    });

    res.json({
      data: rows,
      total: count,
      limit,
      page
    });
  } catch (error) {
    console.error('List vouchers error:', error);
    res.status(500).json({ error: 'Error retrieving vouchers' });
  }
};

export const redeemVoucher = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { code, customerId, metadata = {} } = req.body;
    
    const voucher = await Voucher.findOne({
      where: {
        code,
        isActive: true
      },
      transaction: t
    });

    if (!voucher) {
      await t.rollback();
      return res.status(404).json({ error: 'Voucher not found' });
    }

    // Check if voucher is restricted to a specific customer
    if (voucher.customerId && voucher.customerId !== customerId) {
      await t.rollback();
      return res.status(403).json({ error: 'This voucher is restricted to a specific customer' });
    }

    // Check if customer ID is required but not provided
    if (voucher.customerId && !customerId) {
      await t.rollback();
      return res.status(400).json({ error: 'Customer ID is required for this voucher' });
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Check if voucher has expired
    if (now > new Date(voucher.expirationDate)) {
      await t.rollback();
      return res.status(400).json({ error: 'Voucher has expired' });
    }

    // Check if voucher has started
    if (now < new Date(voucher.startDate)) {
      await t.rollback();
      return res.status(400).json({ error: 'Voucher is not yet active' });
    }

    // Check if voucher has reached its maximum redemption
    if (voucher.redeemedCount >= voucher.redemption.quantity) {
      await t.rollback();
      return res.status(400).json({ error: 'Voucher has reached maximum redemption' });
    }

    // Check daily quota
    const dailyRedemptions = voucher.dailyRedemptions[today] || 0;
    if (dailyRedemptions >= voucher.redemption.dailyQuota) {
      await t.rollback();
      return res.status(400).json({ error: 'Daily quota exceeded' });
    }

    // Update redemption count and daily redemptions
    const dailyRedemptionsUpdate = {
      ...voucher.dailyRedemptions,
      [today]: dailyRedemptions + 1
    };

    await voucher.update({
      redeemedCount: voucher.redeemedCount + 1,
      dailyRedemptions: dailyRedemptionsUpdate
    }, { transaction: t });

    // Record redemption history
    const redemption = await VoucherRedemption.create({
      voucherId: voucher.id,
      customerId,
      metadata,
      redeemedAt: now
    }, { transaction: t });

    await t.commit();

    res.json({
      message: 'Voucher redeemed successfully',
      discount: voucher.discount,
      redemption: {
        id: redemption.id,
        redeemedAt: redemption.redeemedAt
      }
    });
  } catch (error) {
    await t.rollback();
    console.error('Redeem voucher error:', error);
    res.status(500).json({ error: 'Error redeeming voucher' });
  }
};

export const updateVoucher = async (req, res) => {
  try {
    const { code } = req.params;
    const [updated] = await Voucher.update(req.body, {
      where: { code }
    });

    if (updated) {
      const updatedVoucher = await Voucher.findOne({ where: { code } });
      res.json(updatedVoucher);
    } else {
      res.status(404).json({ error: 'Voucher not found' });
    }
  } catch (error) {
    console.error('Update voucher error:', error);
    res.status(400).json({ error: 'Error updating voucher' });
  }
};

export const validateVoucher = async (req, res) => {
  try {
    const { code, customerId } = req.body;
    
    const voucher = await Voucher.findOne({
      where: {
        code,
        isActive: true
      }
    });

    if (!voucher) {
      return res.status(404).json({ error: 'Voucher not found' });
    }

    // Check if voucher is restricted to a specific customer
    if (voucher.customerId && voucher.customerId !== customerId) {
      return res.status(403).json({ error: 'This voucher is restricted to a specific customer' });
    }

    // Check if customer ID is required but not provided
    if (voucher.customerId && !customerId) {
      return res.status(400).json({ error: 'Customer ID is required for this voucher' });
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Check if voucher has expired
    if (now > new Date(voucher.expirationDate)) {
      return res.status(400).json({ error: 'Voucher has expired' });
    }

    // Check if voucher has started
    if (now < new Date(voucher.startDate)) {
      return res.status(400).json({ error: 'Voucher is not yet active' });
    }

    // Check if voucher has reached its maximum redemption
    if (voucher.redeemedCount >= voucher.redemption.quantity) {
      return res.status(400).json({ error: 'Voucher has reached maximum redemption' });
    }

    // Check daily quota
    const dailyRedemptions = voucher.dailyRedemptions[today] || 0;
    if (dailyRedemptions >= voucher.redemption.dailyQuota) {
      return res.status(400).json({ error: 'Daily quota exceeded' });
    }

    res.json({
      message: 'Voucher is valid',
      discount: voucher.discount
    });
  } catch (error) {
    console.error('Validate voucher error:', error);
    res.status(500).json({ error: 'Error validating voucher' });
  }
};

export const getRedemptionHistory = async (req, res) => {
  try {
    const { voucherId, customerId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const where = {};
    if (voucherId) where.voucherId = voucherId;
    if (customerId) where.customerId = customerId;

    const { count, rows } = await VoucherRedemption.findAndCountAll({
      where,
      limit,
      offset,
      order: [['redeemedAt', 'DESC']],
      include: [{
        model: Voucher,
        attributes: ['code', 'name']
      }]
    });

    res.json({
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
      data: rows
    });
  } catch (error) {
    console.error('Get redemption history error:', error);
    res.status(500).json({ error: 'Error getting redemption history' });
  }
};

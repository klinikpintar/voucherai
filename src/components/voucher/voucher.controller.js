import Voucher from './voucher.model.js';
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

    const { count, rows } = await Voucher.findAndCountAll({
      limit,
      offset,
      order: [['createdAt', 'DESC']]
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
  try {
    const { code } = req.body;
    
    const voucher = await Voucher.findOne({
      where: {
        code,
        isActive: true
      }
    });

    if (!voucher) {
      return res.status(404).json({ error: 'Voucher not found or expired' });
    }

    // Check redemption limits
    if (voucher.redeemedCount >= voucher.redemption.quantity) {
      return res.status(400).json({ error: 'Voucher redemption limit reached' });
    }

    // Check daily quota
    const today = new Date().toISOString().split('T')[0];
    const dailyRedemptions = voucher.dailyRedemptions[today] || 0;
    if (dailyRedemptions >= voucher.redemption.dailyQuota) {
      return res.status(400).json({ error: 'Daily quota exceeded' });
    }

    // Update redemption counts
    voucher.redeemedCount += 1;
    voucher.dailyRedemptions = {
      ...voucher.dailyRedemptions,
      [today]: dailyRedemptions + 1
    };
    await voucher.save();

    res.json(voucher);
  } catch (error) {
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
    const { code } = req.body;
    const voucher = await Voucher.findOne({
      where: {
        code,
        isActive: true
      }
    });

    if (!voucher) {
      return res.status(404).json({ error: 'Voucher not found or expired' });
    }

    // Check redemption limits
    if (voucher.redeemedCount >= voucher.redemption.quantity) {
      return res.status(400).json({ error: 'Voucher redemption limit reached' });
    }

    // Check daily quota
    const today = new Date().toISOString().split('T')[0];
    const dailyRedemptions = voucher.dailyRedemptions[today] || 0;
    if (dailyRedemptions >= voucher.redemption.dailyQuota) {
      return res.status(400).json({ error: 'Daily quota exceeded' });
    }

    res.json({ valid: true, voucher });
  } catch (error) {
    console.error('Validate voucher error:', error);
    res.status(500).json({ error: 'Error validating voucher' });
  }
};

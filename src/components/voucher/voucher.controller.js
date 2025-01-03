import Voucher from './voucher.model.js';
import VoucherRedemption from './voucher-redemption.model.js';
import sequelize from '../../config/database.js';
import { Op } from 'sequelize';

const formatVoucherResponse = (voucher) => ({
  id: voucher.id,
  name: voucher.name,
  code: voucher.code,
  discount: {
    type: voucher.discountType,
    [voucher.discountType === 'AMOUNT' ? 'amount_off' : 'percent_off']: voucher.discountAmount,
    amount_limit: voucher.maxDiscountAmount
  },
  redemption: {
    quantity: voucher.maxRedemptions,
    daily_quota: voucher.dailyQuota,
    redeemed_count: voucher.redeemedCount
  },
  start_date: voucher.startDate,
  expiration_date: voucher.expirationDate,
  is_active: voucher.isActive,
  customer_id: voucher.customerId,
  created_at: voucher.createdAt,
  updated_at: voucher.updatedAt
});

const formatRedemptionResponse = (redemption) => ({
  id: redemption.id,
  voucher_id: redemption.voucherId,
  customer_id: redemption.customerId,
  discount_amount: redemption.discountAmount,
  redeemed_at: redemption.redeemedAt,
  metadata: redemption.metadata,
  created_at: redemption.createdAt,
  updated_at: redemption.updatedAt,
  ...(redemption.Voucher && {
    voucher: {
      code: redemption.Voucher.code,
      name: redemption.Voucher.name
    }
  })
});

export const createVoucher = async (req, res) => {
  try {
    const { 
      name, 
      code, 
      discount, 
      redemption, 
      start_date, 
      expiration_date, 
      is_active, 
      customer_id 
    } = req.body;

    const voucherData = {
      name,
      code,
      discountType: discount.type,
      discountAmount: discount.type === 'AMOUNT' ? discount.amount_off : discount.percent_off,
      maxDiscountAmount: discount.amount_limit || 0,
      maxRedemptions: redemption.quantity,
      dailyQuota: redemption.daily_quota,
      startDate: start_date,
      expirationDate: expiration_date,
      isActive: is_active,
      customerId: customer_id
    };

    const voucher = await Voucher.create(voucherData);
    
    // Format response according to reference
    const response = formatVoucherResponse(voucher);

    res.status(201).json(response);
  } catch (error) {
    console.error('Create voucher error:', error);
    const errorMessage = error.name === 'SequelizeValidationError' 
      ? error.errors.map(err => err.message).join(', ')
      : error.name === 'SequelizeUniqueConstraintError'
      ? 'A voucher with these details already exists'
      : 'Failed to create voucher';
      
    res.status(400).json({
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getVouchers = async (req, res) => {
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

    const data = rows.map(formatVoucherResponse);

    res.json({
      data,
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
    const { code, customer_id, metadata = {} } = req.body;
    
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
    if (voucher.customerId && voucher.customerId !== customer_id) {
      await t.rollback();
      return res.status(403).json({ error: 'This voucher is restricted to a specific customer' });
    }

    // Check if customer ID is required but not provided
    if (voucher.customerId && !customer_id) {
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
    if (voucher.redeemedCount >= voucher.maxRedemptions) {
      await t.rollback();
      return res.status(400).json({ error: 'Voucher has reached maximum redemption' });
    }

    // Check daily quota using redemption history
    const todayRedemptions = await VoucherRedemption.count({
      where: {
        voucherId: voucher.id,
        redeemedAt: {
          [Op.gte]: new Date(today),
          [Op.lt]: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000)
        }
      },
      transaction: t
    });

    if (todayRedemptions >= voucher.dailyQuota) {
      await t.rollback();
      return res.status(400).json({ error: 'Daily quota exceeded' });
    }

    // Update redemption count
    await voucher.increment('redeemedCount', { transaction: t });

    // Record redemption history
    const redemption = await VoucherRedemption.create({
      voucherId: voucher.id,
      customerId: customer_id,
      metadata,
      redeemedAt: now
    }, { transaction: t });

    await t.commit();

    // Prepare discount information
    const discount = {
      type: voucher.discountType,
      value: voucher.discountAmount
    };

    const response = {
      message: 'Voucher redeemed successfully',
      discount,
      redemption: formatRedemptionResponse(redemption)
    };

    res.json(response);
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
      const response = formatVoucherResponse(updatedVoucher);
      res.json(response);
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
    const { code, customer_id } = req.body;
    
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
    if (voucher.customerId && voucher.customerId !== customer_id) {
      return res.status(403).json({ error: 'This voucher is restricted to a specific customer' });
    }

    // Check if customer ID is required but not provided
    if (voucher.customerId && !customer_id) {
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
    if (voucher.redeemedCount >= voucher.maxRedemptions) {
      return res.status(400).json({ error: 'Voucher has reached maximum redemption' });
    }

    // Check daily quota using redemption history
    const todayRedemptions = await VoucherRedemption.count({
      where: {
        voucherId: voucher.id,
        redeemedAt: {
          [Op.gte]: new Date(today),
          [Op.lt]: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    if (todayRedemptions >= voucher.dailyQuota) {
      return res.status(400).json({ error: 'Daily quota exceeded' });
    }

    // Prepare discount information
    const discount = {
      type: voucher.discountType,
      value: voucher.discountAmount
    };

    const response = {
      message: 'Voucher is valid',
      voucher: formatVoucherResponse(voucher)
    };

    res.json(response);
  } catch (error) {
    console.error('Validate voucher error:', error);
    res.status(500).json({ error: 'Error validating voucher' });
  }
};

export const getVoucherByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const voucher = await Voucher.findOne({ 
      where: { code },
      attributes: { exclude: ['createdAt', 'updatedAt'] }
    });

    if (!voucher) {
      return res.status(404).json({
        error: 'Voucher not found'
      });
    }

    return res.json(formatVoucherResponse(voucher));
  } catch (error) {
    console.error('Error fetching voucher:', error);
    return res.status(500).json({
      error: 'Failed to fetch voucher'
    });
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

    const data = rows.map(formatRedemptionResponse);

    res.json({
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
      data
    });
  } catch (error) {
    console.error('Get redemption history error:', error);
    res.status(500).json({ error: 'Error getting redemption history' });
  }
};

export const deleteVoucher = async (req, res) => {
  const code = req.params.code;
  try {
    const deleted = await Voucher.destroy({where: { code }});
    if (deleted) {
      res.json({ message: 'Voucher deleted successfully' });
    } else {
      res.status(404).json({ error: 'Voucher not found' });
    }
  } catch (error) {
    console.error('Delete voucher error:', error);
    res.status(500).json({ error: 'Error deleting voucher' });
  }
};
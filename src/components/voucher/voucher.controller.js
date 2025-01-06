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

/*
Transaction handling prevents race conditions in concurrent voucher redemptions:
Without transaction:
1. User A checks count (9/10)
2. User B checks count (9/10)
3. User A increments (10/10)
4. User B increments (11/10) - Invalid state!

With transaction:
1. User A locks row, checks count (9/10)
2. User B waits for lock
3. User A increments and commits (10/10)
4. User B gets updated count (10/10), validation fails
*/
const validateVoucherLogic = async (voucher, customerId = null, t = null) => {
  if (!voucher) {
    return { isValid: false, error: 'Voucher not found' };
  }

  if (!voucher.isActive) {
    return { isValid: false, error: 'Voucher is inactive' };
  }

  if (voucher.customerId && voucher.customerId !== customerId) {
    return { isValid: false, error: 'This voucher is restricted to a specific customer' };
  }

  if (voucher.customerId && !customerId) {
    return { isValid: false, error: 'Customer ID is required for this voucher' };
  }

  const now = new Date();
  const today = now.toISOString().split('T')[0];

  if (now > new Date(voucher.expirationDate)) {
    return { isValid: false, error: 'Voucher has expired' };
  }

  if (now < new Date(voucher.startDate)) {
    return { isValid: false, error: 'Voucher is not yet active' };
  }

  const currentCount = t 
    ? await Voucher.findOne({ 
        where: { id: voucher.id }, 
        transaction: t, 
        lock: true 
      }).then(v => v.redeemedCount)
    : voucher.redeemedCount;

  if (currentCount >= voucher.maxRedemptions) {
    return { isValid: false, error: 'Voucher has reached maximum redemption' };
  }

  const todayRedemptions = await VoucherRedemption.count({
    where: {
      voucherId: voucher.id,
      redeemedAt: {
        [Op.gte]: new Date(today),
        [Op.lt]: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000)
      }
    },
    ...(t && { transaction: t })
  });

  if (todayRedemptions >= voucher.dailyQuota) {
    return { isValid: false, error: 'Daily quota exceeded' };
  }

  return { isValid: true };
};

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

    const where = {
      isActive: true
    };
    
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

    const vouchers = rows.map(formatVoucherResponse);

    res.json({
      data: vouchers,
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
    const { code } = req.params;
    const { customer_id, metadata = {} } = req.body;
    
    const voucher = await Voucher.findOne({
      where: { code },
      transaction: t,
      lock: true
    });

    const validation = await validateVoucherLogic(voucher, customer_id, t);
    if (!validation.isValid) {
      await t.rollback();
      return res.status(400).json({ error: validation.error });
    }

    await voucher.increment('redeemedCount', { transaction: t });

    const redemption = await VoucherRedemption.create({
      voucherId: voucher.id,
      customerId: customer_id,
      discountAmount: voucher.discountAmount,
      metadata,
      redeemedAt: new Date()
    }, { transaction: t });

    await t.commit();

    const response = {
      message: 'Voucher redeemed successfully',
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
    const voucher = await Voucher.findOne({ where: { code } });

    if (!voucher) {
      return res.status(404).json({
        error: 'Voucher not found'
      });
    }

    const updateData = {};
    const { name, discount, redemption, start_date, expiration_date, is_active, customer_id } = req.body;

    // Only add fields that are present in the request
    if (name !== undefined) updateData.name = name;
    if (is_active !== undefined) updateData.isActive = is_active;
    if (start_date !== undefined) updateData.startDate = start_date;
    if (expiration_date !== undefined) updateData.expirationDate = expiration_date;
    if (customer_id !== undefined) updateData.customerId = customer_id;

    // Handle discount object if present
    if (discount) {
      if (discount.type !== undefined) updateData.discountType = discount.type;
      if (discount.type === 'AMOUNT' && discount.amount_off !== undefined) {
        updateData.discountAmount = discount.amount_off;
      } else if (discount.type === 'PERCENTAGE' && discount.percent_off !== undefined) {
        updateData.discountAmount = discount.percent_off;
      }
      if (discount.amount_limit !== undefined) updateData.maxDiscountAmount = discount.amount_limit;
    }

    // Handle redemption object if present
    if (redemption) {
      if (redemption.quantity !== undefined) updateData.maxRedemptions = redemption.quantity;
      if (redemption.daily_quota !== undefined) updateData.dailyQuota = redemption.daily_quota;
    }

    await voucher.update(updateData);
    
    // Fetch updated voucher to return
    const updatedVoucher = await Voucher.findOne({ where: { code } });
    return res.json(formatVoucherResponse(updatedVoucher));
  } catch (error) {
    console.error('Error updating voucher:', error);
    return res.status(500).json({
      error: 'Failed to update voucher'
    });
  }
};

export const getVoucherByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const customer_id = req.query.customer_id;
    
    const voucher = await Voucher.findOne({ 
      where: { code },
      attributes: { exclude: ['createdAt', 'updatedAt'] }
    });

    if (!voucher) {
      return res.status(404).json({
        error: 'Voucher not found'
      });
    }

    const validation = await validateVoucherLogic(voucher, customer_id);
    const response = formatVoucherResponse(voucher);
    response.isValid = validation.isValid;
    if (!validation.isValid) {
      response.validationError = validation.error;
    }
    
    return res.json(response);
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
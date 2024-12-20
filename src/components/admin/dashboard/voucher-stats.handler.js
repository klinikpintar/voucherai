import { Op } from 'sequelize';
import Voucher from '../../voucher/voucher.model.js';

export const getVoucherStats = async () => {
  const now = new Date();
  
  // Get all vouchers
  const vouchers = await Voucher.findAll();
  
  // Calculate statistics
  const stats = {
    total: vouchers.length,
    active: vouchers.filter(v => v.isActive && v.expirationDate > now && v.redeemedCount < v.redemption.quantity).length,
    expired: vouchers.filter(v => v.expirationDate <= now).length,
    fullyRedeemed: vouchers.filter(v => v.redeemedCount >= v.redemption.quantity).length
  };

  // Get top performing vouchers
  const topVouchers = await Voucher.findAll({
    where: {
      redeemedCount: {
        [Op.gt]: 0
      }
    },
    order: [['redeemedCount', 'DESC']],
    limit: 5
  });

  // Get recent redemptions (last 10)
  const recentRedemptions = vouchers.reduce((acc, voucher) => {
    const today = new Date().toISOString().split('T')[0];
    const dailyRedemptions = voucher.dailyRedemptions[today] || 0;
    
    if (dailyRedemptions > 0) {
      acc.push({
        id: voucher.id,
        code: voucher.code,
        time: new Date(),
        status: 'Redeemed'
      });
    }
    return acc;
  }, []).slice(0, 10);

  return {
    ...stats,
    topVouchers,
    recentRedemptions
  };
};

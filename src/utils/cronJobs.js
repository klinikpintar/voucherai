import Voucher from '../components/voucher/voucher.model.js';
import { Op } from 'sequelize';

export const checkVoucherExpiry = async () => {
  try {
    const [updatedCount] = await Voucher.update(
      { isActive: false },
      {
        where: {
          isActive: true,
          expirationDate: {
            [Op.lt]: new Date()
          }
        }
      }
    );
    console.log(`[${new Date().toISOString()}] Voucher expiry check completed. ${updatedCount} vouchers deactivated.`);
  } catch (error) {
    console.error('Error checking voucher expiry:', error);
  }
};

// Run the cron job every minute
setInterval(checkVoucherExpiry, 60 * 1000);

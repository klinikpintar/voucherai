import Voucher from '../voucher/voucher.model.js';
import VoucherRedemption from '../voucher/voucher-redemption.model.js';
import ApiToken from '../auth/apiToken.model.js';
import { getVoucherStats } from './dashboard/voucher-stats.handler.js';
import { componentLoader, dashboardComponent } from './component-loader.js';

const adminJsConfig = {
  databases: [],
  rootPath: '/admin',
  componentLoader,
  resources: [
    {
      resource: Voucher,
      options: {
        navigation: {
          name: 'Vouchers',
          icon: 'Ticket'
        },
        properties: {
          id: {
            isVisible: { list: true, filter: true, show: true, edit: false },
            position: 1
          },
          isActive: {
            isVisible: { list: true, filter: true, show: true, edit: true },
            position: 2
          },
          name: {
            isVisible: { list: true, filter: true, show: true, edit: true },
            position: 3
          },
          code: {
            isVisible: { list: true, filter: true, show: true, edit: true },
            position: 4
          },
          discountType: {
            isVisible: { list: true, filter: true, show: true, edit: true },
            position: 5,
            availableValues: [
              { value: 'PERCENTAGE', label: 'Percentage Off' },
              { value: 'AMOUNT', label: 'Fixed Amount Off' }
            ]
          },
          discountAmount: {
            isVisible: { list: true, filter: true, show: true, edit: true },
            position: 6,
            type: 'number'
          },
          maxRedemptions: {
            isVisible: { list: true, filter: true, show: true, edit: true },
            position: 7,
            type: 'number'
          },
          dailyQuota: {
            isVisible: { list: true, filter: true, show: true, edit: true },
            position: 8,
            type: 'number'
          },
          startDate: {
            isVisible: { list: true, filter: true, show: true, edit: true },
            position: 9,
            type: 'datetime'
          },
          expirationDate: {
            isVisible: { list: true, filter: true, show: true, edit: true },
            position: 10,
            type: 'datetime'
          },
          redeemedCount: {
            isVisible: { list: true, filter: true, show: true, edit: false },
            position: 11,
            type: 'number'
          },
          customerId: {
            isVisible: { list: true, filter: true, show: true, edit: true },
            position: 12
          },
          createdAt: {
            isVisible: { list: true, filter: true, show: true, edit: false },
            position: 13
          },
          updatedAt: {
            isVisible: { list: false, filter: true, show: true, edit: false },
            position: 14
          }
        },
        actions: {
          new: {
            before: async (request) => {
              if (request.payload.discountType === 'PERCENTAGE' && request.payload.discountAmount > 100) {
                throw new Error('Percentage discount cannot be more than 100%');
              }
              if (request.payload.discountAmount < 0) {
                throw new Error('Discount amount cannot be negative');
              }
              if (request.payload.maxRedemptions < 1) {
                throw new Error('Maximum redemptions must be at least 1');
              }
              if (request.payload.dailyQuota < 1) {
                throw new Error('Daily quota must be at least 1');
              }
              if (request.payload.dailyQuota > request.payload.maxRedemptions) {
                throw new Error('Daily quota cannot be greater than maximum redemptions');
              }
              return request;
            }
          },
          edit: {
            before: async (request) => {
              if (request.payload.discountType === 'PERCENTAGE' && request.payload.discountAmount > 100) {
                throw new Error('Percentage discount cannot be more than 100%');
              }
              if (request.payload.discountAmount < 0) {
                throw new Error('Discount amount cannot be negative');
              }
              if (request.payload.maxRedemptions < 1) {
                throw new Error('Maximum redemptions must be at least 1');
              }
              if (request.payload.dailyQuota < 1) {
                throw new Error('Daily quota must be at least 1');
              }
              if (request.payload.dailyQuota > request.payload.maxRedemptions) {
                throw new Error('Daily quota cannot be greater than maximum redemptions');
              }
              return request;
            }
          }
        },
        sort: {
          sortBy: 'createdAt',
          direction: 'desc'
        },
        listProperties: [
          'id',
          'isActive',
          'name',
          'code',
          'discountType',
          'discountAmount',
          'maxRedemptions',
          'redeemedCount',
          'expirationDate'
        ],
        filterProperties: [
          'isActive',
          'name',
          'code',
          'discountType',
          'discountAmount',
          'customerId',
          'startDate',
          'expirationDate'
        ],
        showProperties: [
          'id',
          'isActive',
          'name',
          'code',
          'discountType',
          'discountAmount',
          'maxRedemptions',
          'dailyQuota',
          'customerId',
          'startDate',
          'expirationDate',
          'redeemedCount',
          'createdAt',
          'updatedAt'
        ]
      }
    },
    {
      resource: VoucherRedemption,
      options: {
        navigation: {
          name: 'Voucher Redemptions',
          icon: 'Ticket'
        },
        properties: {
          id: {
            isVisible: { list: true, filter: true, show: true, edit: false },
            position: 1
          },
          voucherId: {
            isVisible: { list: true, filter: true, show: true, edit: false },
            position: 2
          },
          customerId: {
            isVisible: { list: true, filter: true, show: true, edit: false },
            position: 3
          },
          redeemedAt: {
            isVisible: { list: true, filter: true, show: true, edit: false },
            position: 4
          },
          metadata: {
            isVisible: { list: false, filter: false, show: true, edit: false },
            position: 5
          },
          createdAt: {
            isVisible: { list: true, filter: true, show: true, edit: false },
            position: 6
          },
          updatedAt: {
            isVisible: { list: false, filter: true, show: true, edit: false },
            position: 7
          }
        },
        actions: {
          new: { isAccessible: false },
          edit: { isAccessible: false },
          delete: { isAccessible: false }
        },
        sort: {
          sortBy: 'redeemedAt',
          direction: 'desc'
        },
        listProperties: [
          'id',
          'voucherId',
          'customerId',
          'redeemedAt',
          'createdAt'
        ],
        filterProperties: [
          'voucherId',
          'customerId',
          'redeemedAt'
        ],
        showProperties: [
          'id',
          'voucherId',
          'customerId',
          'redeemedAt',
          'metadata',
          'createdAt',
          'updatedAt'
        ]
      }
    },
    {
      resource: ApiToken,
      options: {
        navigation: {
          name: 'API Management',
          icon: 'Key',
        },
        properties: {
          id: { 
            isVisible: { list: true, filter: true, show: true, edit: false },
            position: 1
          },
          token: { 
            isVisible: { list: true, filter: true, show: true, edit: false },
            isTitle: true,
            position: 2
          },
          name: {
            isTitle: false,
            isRequired: true,
            position: 3
          },
          description: {
            type: 'textarea',
            isVisible: { list: false, filter: false, show: true, edit: true },
            props: {
              rows: 3
            },
            position: 4
          },
          isActive: {
            isVisible: { list: true, filter: true, show: true, edit: true },
            type: 'boolean',
            position: 5
          },
          expiresAt: {
            type: 'datetime',
            isVisible: { list: true, filter: true, show: true, edit: true },
            position: 6
          },
          lastUsedAt: {
            isVisible: { list: true, filter: true, show: true, edit: false },
            position: 7
          },
          createdAt: {
            isVisible: { list: true, filter: true, show: true, edit: false },
            position: 8
          },
          updatedAt: {
            isVisible: { list: false, filter: true, show: true, edit: false },
            position: 9
          }
        },
        editProperties: [
          'name',
          'description',
          'isActive',
          'expiresAt'
        ],
        showProperties: [
          'id',
          'name',
          'token',
          'description',
          'isActive',
          'expiresAt',
          'lastUsedAt',
          'createdAt',
          'updatedAt'
        ],
        listProperties: [
          'name',
          'token',
          'isActive',
          'expiresAt',
          'lastUsedAt',
          'createdAt'
        ],
        filterProperties: [
          'name',
          'isActive',
          'expiresAt',
          'createdAt'
        ],
        sort: {
          sortBy: 'createdAt',
          direction: 'desc',
        }
      }
    }
  ],
  dashboard: {
    component: dashboardComponent,
    handler: async () => {
      const stats = await getVoucherStats();
      return {
        data: stats
      };
    },
  },
  branding: {
    companyName: 'Voucher Management System',
    logo: false,
    favicon: false,
    withMadeWithLove: false,
    theme: {
      colors: {
        primary100: '#4268F6',
        primary80: '#6483F8',
        primary60: '#879FFA',
        primary40: '#A9BAFB',
        primary20: '#CBD6FD',
        filterBg: '#2C3E50',
        accent: '#4268F6',
        bg: '#F5F6FA',
      }
    }
  },
  locale: {
    language: 'en',
    translations: {
      labels: {
        ApiToken: 'API Tokens',
        Voucher: 'Vouchers',
        VoucherRedemption: 'Voucher Redemptions',
        'discount.type': 'Discount Type',
        'discount.amountOff': 'Amount Off',
        'discount.percentOff': 'Percentage Off (%)',
        'redemption.quantity': 'Total Quantity',
        'redemption.dailyQuota': 'Daily Quota',
        customerId: 'Customer ID',
      },
      messages: {
        successfullyCreated: 'Successfully created',
        successfullyUpdated: 'Successfully updated',
        successfullyDeleted: 'Successfully deleted',
      }
    }
  }
};

export default adminJsConfig;

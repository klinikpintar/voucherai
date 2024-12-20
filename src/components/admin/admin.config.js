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
          name: 'Voucher Management',
          icon: 'Tag',
        },
        properties: {
          id: { 
            isVisible: { list: true, filter: true, show: true, edit: false },
            isTitle: false,
            position: 1
          },
          name: {
            isTitle: true,
            isRequired: true,
            position: 2
          },
          code: {
            type: 'string',
            position: 3
          },
          customerId: {
            type: 'string',
            isRequired: false,
            position: 4,
            description: 'If set, only this customer can redeem the voucher'
          },
          isActive: {
            isVisible: { list: true, filter: true, show: true, edit: true },
            type: 'boolean',
            position: 5
          },
          'discount.type': {
            type: 'select',
            isRequired: true,
            availableValues: [
              { value: 'AMOUNT', label: 'Fixed Amount' },
              { value: 'PERCENTAGE', label: 'Percentage' }
            ],
            position: 6
          },
          'discount.amountOff': {
            type: 'number',
            isVisible: {
              list: true,
              filter: true,
              show: true,
              edit: ({ record }) => record?.params?.['discount.type'] === 'AMOUNT'
            },
            position: 7
          },
          'discount.percentOff': {
            type: 'number',
            min: 0,
            max: 100,
            isVisible: {
              list: true,
              filter: true,
              show: true,
              edit: ({ record }) => record?.params?.['discount.type'] === 'PERCENTAGE'
            },
            position: 8
          },
          'redemption.quantity': {
            type: 'number',
            isRequired: true,
            min: 1,
            position: 9
          },
          'redemption.dailyQuota': {
            type: 'number',
            isRequired: true,
            min: 1,
            position: 10
          },
          startDate: {
            type: 'datetime',
            isRequired: true,
            position: 11
          },
          expirationDate: {
            type: 'datetime',
            isRequired: true,
            position: 12
          },
          redeemedCount: {
            isVisible: { list: true, filter: true, show: true, edit: false },
            type: 'number',
            position: 13
          },
          createdAt: {
            isVisible: { list: true, filter: true, show: true, edit: false },
            position: 14
          },
          updatedAt: {
            isVisible: { list: false, filter: true, show: true, edit: false },
            position: 15
          }
        },
        editProperties: [
          'name',
          'code',
          'customerId',
          'isActive',
          'startDate',
          'expirationDate',
          'discount.type',
          'discount.amountOff',
          'discount.percentOff',
          'redemption.quantity',
          'redemption.dailyQuota'
        ],
        showProperties: [
          'id',
          'name',
          'code',
          'customerId',
          'isActive',
          'startDate',
          'expirationDate',
          'discount.type',
          'discount.amountOff',
          'discount.percentOff',
          'redemption.quantity',
          'redemption.dailyQuota',
          'redeemedCount',
          'createdAt',
          'updatedAt'
        ],
        listProperties: [
          'name',
          'code',
          'customerId',
          'isActive',
          'startDate',
          'expirationDate',
          'redeemedCount'
        ],
        filterProperties: [
          'name',
          'code',
          'customerId',
          'isActive',
          'startDate',
          'expirationDate'
        ],
        sort: {
          sortBy: 'createdAt',
          direction: 'desc',
        }
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

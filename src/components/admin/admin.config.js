import Voucher from '../voucher/voucher.model.js';
import VoucherRedemption from '../voucher/voucher-redemption.model.js';
import ApiToken from '../auth/apiToken.model.js';

const adminJsConfig = {
  databases: [],
  rootPath: '/admin',
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
            position: 3,
            isRequired: true
          },
          code: {
            isVisible: { list: true, filter: true, show: true, edit: true },
            position: 4,
            isRequired: true
          },
          discountType: {
            isVisible: { list: true, filter: true, show: true, edit: true },
            position: 5,
            isRequired: true,
            availableValues: [
              { value: 'PERCENTAGE', label: 'Percentage Off' },
              { value: 'AMOUNT', label: 'Fixed Amount Off' }
            ]
          },
          discountAmount: {
            isVisible: { list: true, filter: true, show: true, edit: true },
            position: 6,
            isRequired: true,
            type: 'number',
            props: {
              type: 'number',
              min: 0,
              step: 'any'
            }
          },
          maxDiscountAmount: {
            isVisible: { list: true, filter: true, show: true, edit: true },
            position: 7,
            isRequired: false,
            type: 'number',
            props: {
              type: 'number',
              min: 0,
              step: 'any'
            }
          },
          maxRedemptions: {
            isVisible: { list: true, filter: true, show: true, edit: true },
            position: 8,
            isRequired: true,
            type: 'number',
            props: {
              type: 'number',
              min: 1
            }
          },
          dailyQuota: {
            isVisible: { list: true, filter: true, show: true, edit: true },
            position: 9,
            isRequired: true,
            type: 'number',
            props: {
              type: 'number',
              min: 1
            }
          },
          startDate: {
            isVisible: { list: true, filter: true, show: true, edit: true },
            position: 10,
            type: 'datetime',
            isRequired: true
          },
          expirationDate: {
            isVisible: { list: true, filter: true, show: true, edit: true },
            position: 11,
            type: 'datetime',
            isRequired: true
          },
          redeemedCount: {
            isVisible: { list: true, filter: false, show: true, edit: false },
            position: 12,
            type: 'number'
          },
          customerId: {
            isVisible: { list: true, filter: true, show: true, edit: true },
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
        actions: {
          new: {
            before: async (request) => {
              console.log('==== BEFORE HOOK TRIGGERED ====');
              console.log('Action:', request.method);
              console.log('Record:', request.record);
              console.log('Payload:', JSON.stringify(request.payload, null, 2));
              console.log('========================');

              // Only process if we have data to validate (POST request)
              if (request.method !== 'post') {
                return request;
              }

              if (!request.payload) {
                console.log('No payload to process');
                return request;
              }

              console.log('Processing payload for validation...');

              if (request.payload.discountType === 'PERCENTAGE' && parseFloat(request.payload.discountAmount) > 100) {
                throw new Error('Percentage discount cannot be more than 100%');
              }
              if (parseFloat(request.payload.discountAmount) < 0) {
                throw new Error('Discount amount cannot be negative');
              }

              // Validate max discount amount
              const maxDiscountAmount = parseFloat(request.payload.maxDiscountAmount);
              const discountAmount = parseFloat(request.payload.discountAmount);

              if (maxDiscountAmount < 0) {
                throw new Error('Maximum discount amount cannot be negative');
              }

              if (maxDiscountAmount > 0 && discountAmount > maxDiscountAmount) {
                throw new Error('Discount amount cannot be greater than maximum discount amount');
              }

              // Convert maxRedemptions and dailyQuota to integers
              const maxRedemptions = parseInt(request.payload.maxRedemptions, 10);
              const dailyQuota = parseInt(request.payload.dailyQuota, 10);

              console.log('Parsed values:', {
                maxRedemptions,
                dailyQuota,
                discountAmount,
                maxDiscountAmount
              });

              if (isNaN(maxRedemptions) || maxRedemptions < 1) {
                throw new Error('Maximum redemptions must be at least 1');
              }
              if (isNaN(dailyQuota) || dailyQuota < 1) {
                throw new Error('Daily quota must be at least 1');
              }
              if (dailyQuota > maxRedemptions) {
                throw new Error('Daily quota cannot be greater than maximum redemptions');
              }

              // Validate dates
              const startDate = new Date(request.payload.startDate);
              const expirationDate = new Date(request.payload.expirationDate);
              
              if (expirationDate <= startDate) {
                throw new Error('Expiration date must be after start date');
              }

              // Update the request payload with the parsed values
              request.payload.maxRedemptions = maxRedemptions;
              request.payload.dailyQuota = dailyQuota;
              request.payload.discountAmount = discountAmount;
              request.payload.maxDiscountAmount = maxDiscountAmount || 0;

              console.log('Final payload:', JSON.stringify(request.payload, null, 2));
              return request;
            }
          },
          edit: {
            before: async (request) => {
              // Reuse the same validation logic from new action
              return adminJsConfig.resources[0].options.actions.new.before(request);
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
            position: 2,
            reference: 'Vouchers'
          },
          customerId: {
            isVisible: { list: true, filter: true, show: true, edit: false },
            position: 3
          },
          redeemedAt: {
            isVisible: { list: true, filter: true, show: true, edit: false },
            position: 4,
            type: 'datetime'
          },
          metadata: {
            isVisible: { list: false, filter: false, show: true, edit: false },
            position: 5,
            type: 'mixed',
            components: {
              show: (props) => {
                const value = props.record?.params?.metadata;
                if (!value) return 'No metadata';
                try {
                  const parsed = typeof value === 'string' ? JSON.parse(value) : value;
                  return JSON.stringify(parsed, null, 2);
                } catch (e) {
                  return 'Invalid JSON';
                }
              }
            }
          },
          createdAt: {
            isVisible: { list: true, filter: true, show: true, edit: false },
            position: 6,
            type: 'datetime'
          },
          updatedAt: {
            isVisible: { list: false, filter: true, show: true, edit: false },
            position: 7,
            type: 'datetime'
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
          icon: 'Key'
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
        actions: {
          new: {
            before: async (request) => {
              // Validate expiration date if provided
              if (request.method !== 'post') {
                return request;
              }

              if (!request.payload) {
                console.log('No payload to process');
                return request;
              }

              console.log('Processing payload for validation...');

              if (request.payload.expiresAt) {
                const expiresAt = new Date(request.payload.expiresAt);
                if (expiresAt <= new Date()) {
                  throw new Error('Expiration date must be in the future');
                }
              }
              return request;
            }
          },
          edit: {
            before: async (request) => {
              // Validate expiration date if provided
              if (request.method !== 'post') {
                return request;
              }

              if (!request.payload) {
                console.log('No payload to process');
                return request;
              }

              console.log('Processing payload for validation...');

              if (request.payload.expiresAt) {
                const expiresAt = new Date(request.payload.expiresAt);
                if (expiresAt <= new Date()) {
                  throw new Error('Expiration date must be in the future');
                }
              }
              return request;
            }
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
          direction: 'desc'
        }
      }
    }
  ],
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
        bg: '#F5F6FA'
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
        customerId: 'Customer ID'
      },
      messages: {
        successfullyCreated: 'Successfully created',
        successfullyUpdated: 'Successfully updated',
        successfullyDeleted: 'Successfully deleted'
      }
    }
  }
};

export default adminJsConfig;

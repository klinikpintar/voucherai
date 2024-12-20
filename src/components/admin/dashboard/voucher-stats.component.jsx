import React from 'react';
import { Box, H2, H4, Text, Table, TableHead, TableBody, TableRow, TableCell } from '@adminjs/design-system';

const Dashboard = (props) => {
  const { data } = props;

  if (!data) {
    return (
      <Box variant="grey">
        <Box variant="white" padding="xl">
          <H2>Loading statistics...</H2>
        </Box>
      </Box>
    );
  }

  return (
    <Box variant="grey">
      <Box variant="white" padding="xl">
        <H2>Voucher Statistics</H2>
        
        {/* Summary Cards */}
        <Box flex flexDirection="row" justifyContent="space-between" marginBottom="xl">
          <Box variant="white" padding="lg" flex={1} marginRight="default" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}>
            <H4>Total Vouchers</H4>
            <Text>{data.total || 0}</Text>
          </Box>
          <Box variant="white" padding="lg" flex={1} marginRight="default" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}>
            <H4>Active Vouchers</H4>
            <Text>{data.active || 0}</Text>
          </Box>
          <Box variant="white" padding="lg" flex={1} marginRight="default" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}>
            <H4>Expired Vouchers</H4>
            <Text>{data.expired || 0}</Text>
          </Box>
          <Box variant="white" padding="lg" flex={1} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}>
            <H4>Fully Redeemed</H4>
            <Text>{data.fullyRedeemed || 0}</Text>
          </Box>
        </Box>

        {/* Top Performing Vouchers */}
        <Box marginBottom="xl">
          <H4>Top Performing Vouchers</H4>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Redemptions</TableCell>
                <TableCell>Remaining</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(data.topVouchers || []).map((voucher) => (
                <TableRow key={voucher.id}>
                  <TableCell>{voucher.code}</TableCell>
                  <TableCell>{voucher.name}</TableCell>
                  <TableCell>{voucher.redeemedCount}</TableCell>
                  <TableCell>{voucher.redemption?.quantity - voucher.redeemedCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>

        {/* Recent Redemptions */}
        <Box>
          <H4>Recent Redemptions</H4>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(data.recentRedemptions || []).map((redemption) => (
                <TableRow key={redemption.id}>
                  <TableCell>{redemption.code}</TableCell>
                  <TableCell>{new Date(redemption.time).toLocaleString()}</TableCell>
                  <TableCell>{redemption.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;

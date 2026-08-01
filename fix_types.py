import re

with open('src/types.ts', 'r') as f:
    content = f.read()

# Add fields to Order
new_fields = """  // Tracking & Timeline
  acceptedAt?: string;
  packedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  trackingNumber?: string;
  courierName?: string;
  estimatedDelivery?: string;
  currentStatus?: string;
  activityLogs?: { timestamp: string; message: string }[];
"""

content = content.replace("  logistics?: LogisticsDetails;", "  logistics?: LogisticsDetails;\n\n" + new_fields)

with open('src/types.ts', 'w') as f:
    f.write(content)

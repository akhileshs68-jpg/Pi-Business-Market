import re

with open('src/pages/OrderDetails.tsx', 'r') as f:
    content = f.read()

if "import { storeService } from '../services/storeService';" not in content:
    content = content.replace(
        "import { Order, OrderItem, OrderTimelineEvent, OrderStatus, PaymentStatus, FulfillmentStatus } from '../types';",
        "import { Order, OrderItem, OrderTimelineEvent, OrderStatus, PaymentStatus, FulfillmentStatus, Store } from '../types';\nimport { storeService } from '../services/storeService';"
    )

with open('src/pages/OrderDetails.tsx', 'w') as f:
    f.write(content)

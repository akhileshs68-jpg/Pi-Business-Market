import re

with open('src/pages/OrderDetails.tsx', 'r') as f:
    content = f.read()

# Add Store and storeService imports
if "Store" not in content and "storeService" not in content:
    content = content.replace(
        "import { Order, OrderItem, OrderTimelineEvent, OrderStatus, PaymentStatus, FulfillmentStatus } from '../types';",
        "import { Order, OrderItem, OrderTimelineEvent, OrderStatus, PaymentStatus, FulfillmentStatus, Store } from '../types';\nimport { storeService } from '../services/storeService';"
    )

# Add missing icons
if "Store as StoreIcon" not in content:
    content = content.replace(
        "MessageSquare\n} from 'lucide-react';",
        "MessageSquare,\n  Store as StoreIcon,\n  Star,\n  MapPin as MapPinIcon,\n  RotateCcw,\n  Heart,\n  AlertTriangle,\n  Tag\n} from 'lucide-react';"
    )

# Add store state
if "const [store, setStore] = useState<Store | null>(null);" not in content:
    content = content.replace(
        "const [order, setOrder] = useState<Order | null>(null);",
        "const [order, setOrder] = useState<Order | null>(null);\n  const [store, setStore] = useState<Store | null>(null);"
    )

# Fetch store
fetch_store_code = """      if (data) {
        setOrder(data);
        if (data.storeId || data.businessId) {
          const s = await storeService.getStore(data.storeId || data.businessId);
          setStore(s);
        }"""
content = content.replace("      if (data) {\n        setOrder(data);", fetch_store_code)

with open('src/pages/OrderDetails.tsx', 'w') as f:
    f.write(content)

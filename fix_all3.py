import re

with open('src/pages/OrderDetails.tsx', 'r') as f:
    content = f.read()

# Fix TS error
content = content.replace(
    "{order.orderStatus !== OrderStatus.COMPLETED && order.orderStatus !== OrderStatus.DELIVERED && (",
    "{order.orderStatus !== OrderStatus.DELIVERED && ("
)

with open('src/pages/OrderDetails.tsx', 'w') as f:
    f.write(content)

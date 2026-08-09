const fs = require('fs');
let content = fs.readFileSync('firestore.rules', 'utf8');

const targetOrdersRules = `    match /orders/{orderId} {
      allow read: if true;
      allow write: if canMutate();
    }`;

const safeOrdersRules = `    match /orders/{orderId} {
      allow read: if isSignedIn() && (
        isOwner(resource.data.buyerId) || 
        isOwner(resource.data.userUid) || 
        isOwner(resource.data.sellerId) || 
        isOwner(resource.data.businessId) || 
        isAdmin()
      );
      
      // Allow creation by authenticated user (often done client-side if server fallback triggers)
      // but enforce that client cannot spoof financial fields that differ from Pi completion.
      // Actually, order creation is primarily server-side. If client-side fallback happens,
      // it should be allowed but we restrict what they can modify on update.
      allow create: if isSignedIn() && canMutate() && (
        isOwner(incoming().buyerId) || 
        isOwner(incoming().userUid) || 
        isAdmin()
      );

      // Financial fields should ideally be immutable by client. 
      allow update: if isSignedIn() && canMutate() && (
        isOwner(resource.data.buyerId) || 
        isOwner(resource.data.userUid) || 
        isOwner(resource.data.sellerId) || 
        isOwner(resource.data.businessId) || 
        isAdmin()
      ) && (
        isAdmin() || (
          // Disallow modifying core financial amounts and identities 
          !incoming().diff(resource.data).affectedKeys().hasAny([
            'grandTotal', 'subtotal', 'tax', 'shipping', 'price', 
            'paymentStatus', 'totalAmount', 'amount', 'piAmount', 'localAmount',
            'businessId', 'sellerId', 'storeId'
          ])
        )
      );
      
      allow delete: if isAdmin();
    }`;

const targetShipmentsRules = `    match /shipments/{shipmentId} {
      allow read, write: if isSignedIn();
    }`;

const safeShipmentsRules = `    match /shipments/{shipmentId} {
      allow read: if isSignedIn() && (
        isOwner(resource.data.buyerId) ||
        isOwner(resource.data.sellerId) ||
        isOwner(resource.data.businessId) ||
        isAdmin()
      );
      allow create, update: if isSignedIn() && canMutate() && (
        isOwner(incoming().sellerId) ||
        isOwner(incoming().businessId) ||
        isAdmin()
      );
      allow delete: if isAdmin();
    }`;

if (content.includes(targetOrdersRules) && content.includes(targetShipmentsRules)) {
    content = content.replace(targetOrdersRules, safeOrdersRules);
    content = content.replace(targetShipmentsRules, safeShipmentsRules);
    fs.writeFileSync('firestore.rules', content);
    console.log('Successfully patched firestore.rules');
} else {
    console.error('Target rules not found');
}

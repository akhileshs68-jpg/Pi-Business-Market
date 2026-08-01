const fs = require('fs');
let content = fs.readFileSync('src/pages/CartPage.tsx', 'utf8');

content = content.replace(
  "import { collection, query, where, getDocs } from 'firebase/firestore';",
  "import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';"
);

const newEffect = `  useEffect(() => {
    if (!user?.uid) return;
    const db = getFirebaseDb();
    
    // Wishlist snapshot
    const wishlistQuery = query(collection(db, 'wishlists'), where('userUid', '==', user.uid));
    const unsubWishlist = onSnapshot(wishlistQuery, (snapshot) => {
      setWishlistCount(snapshot.size);
    });

    // Carts snapshot
    const cartsQuery = query(collection(db, 'carts'), where('userUid', '==', user.uid));
    const unsubCarts = onSnapshot(cartsQuery, (snapshot) => {
      const cartDocs = snapshot.docs;
      if (cartDocs.length === 0) {
        setCartCount(0);
        return;
      }
      
      const cartIds = cartDocs.map(doc => doc.id);
      
      // Items snapshots
      let currentItemsCount = 0;
      let unsubsItems: (() => void)[] = [];
      let countsMap = new Map<string, number>();

      cartIds.forEach(cartId => {
        const itemsQuery = query(collection(db, 'cartItems'), where('cartId', '==', cartId));
        const unsub = onSnapshot(itemsQuery, (itemsSnap) => {
          countsMap.set(cartId, itemsSnap.size);
          let total = 0;
          for (const count of countsMap.values()) {
            total += count;
          }
          setCartCount(total);
        });
        unsubsItems.push(unsub);
      });
      
      return () => {
        unsubsItems.forEach(u => u());
      };
    });

    return () => {
      unsubWishlist();
      unsubCarts();
    };
  }, [user]);

  const updateCounts = () => {};`;

content = content.replace(/  useEffect\(\(\) => \{\n    if \(user\?\.uid\) \{\n      updateCounts\(\);\n    \}\n  \}, \[user\]\);\n\n  const updateCounts = async \(\) => \{[\s\S]*?  \};\n/, newEffect + '\n');

fs.writeFileSync('src/pages/CartPage.tsx', content);

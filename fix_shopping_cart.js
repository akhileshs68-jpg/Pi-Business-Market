const fs = require('fs');

let content = fs.readFileSync('src/components/cart/ShoppingCart.tsx', 'utf8');

// Replace the top imports to include onSnapshot
content = content.replace(
  "import { collection, query, where, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';",
  "import { collection, query, where, getDocs, doc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';"
);

const loadCartDataCode = `  const cartIdsString = carts.map(c => c.cartId).sort().join(',');

  useEffect(() => {
    if (!userUid) return;
    setLoading(true);
    const db = getFirebaseDb();
    const cartsQuery = query(collection(db, 'carts'), where('userUid', '==', userUid));
    
    const unsubscribe = onSnapshot(cartsQuery, (snapshot) => {
      const fetchedCarts = snapshot.docs.map(doc => doc.data() as Cart);
      setCarts(fetchedCarts);
      if (fetchedCarts.length === 0) {
        setLoading(false);
      }
    }, (error) => {
      console.error("Error listening to carts:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userUid]);

  useEffect(() => {
    if (!cartIdsString) {
      setItems([]);
      return;
    }
    const cartIds = cartIdsString.split(',');
    const db = getFirebaseDb();
    
    const unsubs: (() => void)[] = [];
    let itemsMap = new Map<string, ExtendedCartItem[]>();
    let loadedCount = 0;

    cartIds.forEach(cartId => {
      const itemsQuery = query(collection(db, 'cartItems'), where('cartId', '==', cartId));
      const unsub = onSnapshot(itemsQuery, (snapshot) => {
        const cartItems = snapshot.docs.map(doc => doc.data() as ExtendedCartItem);
        itemsMap.set(cartId, cartItems);
        
        // Flatten and update state
        const allItems: ExtendedCartItem[] = [];
        for (const cid of cartIds) {
          const cidItems = itemsMap.get(cid) || [];
          allItems.push(...cidItems);
        }
        setItems(allItems);
        
        loadedCount++;
        if (loadedCount >= cartIds.length) {
          setLoading(false);
        }
      });
      unsubs.push(unsub);
    });

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [cartIdsString]);`;

content = content.replace(/  useEffect\(\(\) => \{\n    if \(userUid\) \{\n      loadCartData\(\);\n    \}\n  \}, \[userUid\]\);\n\n  const loadCartData = async \(\) => \{[\s\S]*?  \};\n/, loadCartDataCode + '\n');

// we should remove all occurrences of `await loadCartData();` since onSnapshot handles it automatically
content = content.replace(/await loadCartData\(\);/g, '// await loadCartData(); removed for realtime');

fs.writeFileSync('src/components/cart/ShoppingCart.tsx', content);

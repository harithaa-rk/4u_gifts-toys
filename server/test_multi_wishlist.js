import axios from 'axios';

const API = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- Starting Multi-Wishlist CRUD & Batch Tests ---');

  // 1. Log in Customer A
  const loginRes = await axios.post(`${API}/auth/login`, {
    email: 'haritha@gmail.com',
    password: 'password123',
  });
  const token = loginRes.data.token;
  const headers = { Authorization: `Bearer ${token}` };
  console.log('✅ 1. Customer A logged in successfully.');

  // 2. Fetch or create a product to test with
  const prodsRes = await axios.get(`${API}/products`);
  const products = prodsRes.data;
  if (!products || products.length === 0) {
    throw new Error('No products in database.');
  }
  const testProduct = products[0];
  console.log(`✅ 2. Test product retrieved: "${testProduct.name}" (ID: ${testProduct._id}, Price: ₹${testProduct.price})`);

  // 3. Create two independent named wishlists
  const list1Res = await axios.post(
    `${API}/collaborative-wishlists`,
    { name: 'Birthday Surprise Wishlist', description: 'Gifts I hope to receive 🎂', visibility: 'private' },
    { headers }
  );
  const list1 = list1Res.data.wishlist;
  console.log(`✅ 3. Created Wishlist 1: "${list1.name}" (ID: ${list1._id})`);

  const list2Res = await axios.post(
    `${API}/collaborative-wishlists`,
    { name: 'Holiday Celebrations', description: 'Festive treats and toys 🎄', visibility: 'shared' },
    { headers }
  );
  const list2 = list2Res.data.wishlist;
  console.log(`✅ 4. Created Wishlist 2: "${list2.name}" (ID: ${list2._id})`);

  // 4. Batch add testProduct to BOTH wishlists in one call
  const batchRes = await axios.post(
    `${API}/collaborative-wishlists/batch-add`,
    {
      wishlistIds: [list1._id, list2._id],
      productId: testProduct._id,
      desiredQuantity: 2,
      note: 'Preferred color Pink',
    },
    { headers }
  );
  console.log('✅ 5. Batch Add Response:', batchRes.data.message);
  console.log('   Results:', batchRes.data.results);
  if (batchRes.data.addedCount !== 2) {
    throw new Error(`Expected addedCount 2, got ${batchRes.data.addedCount}`);
  }

  // 5. Duplicate addition check: try adding to list1 again in batch
  const duplicateRes = await axios.post(
    `${API}/collaborative-wishlists/batch-add`,
    {
      wishlistIds: [list1._id],
      productId: testProduct._id,
      desiredQuantity: 1,
    },
    { headers }
  );
  console.log('✅ 6. Duplicate Prevention Test: status is', duplicateRes.data.results[0].status);
  if (duplicateRes.data.results[0].status !== 'already_exists') {
    throw new Error('Expected already_exists status on duplicate add');
  }

  // 6. Test Edit Wishlist details (rename & change description)
  const editRes = await axios.put(
    `${API}/collaborative-wishlists/${list1._id}`,
    {
      name: 'Birthday Extravaganza Wishlist',
      description: 'Updated description for celebration! ✨',
      visibility: 'shared',
    },
    { headers }
  );
  console.log('✅ 7. Edit Wishlist Name & Visibility:', editRes.data.wishlist.name, '| Visibility:', editRes.data.wishlist.visibility);

  // 7. Test Clear Wishlist
  const clearRes = await axios.post(
    `${API}/collaborative-wishlists/${list1._id}/clear`,
    {},
    { headers }
  );
  console.log('✅ 8. Clear Wishlist response:', clearRes.data.message);
  const verifyClearRes = await axios.get(`${API}/collaborative-wishlists/${list1._id}`, { headers });
  if (verifyClearRes.data.wishlist.items.length !== 0) {
    throw new Error('Wishlist was not empty after clear!');
  }
  console.log('✅ 9. Verified Wishlist 1 now has 0 items.');

  // 8. Test Legacy Wishlist Migration endpoint
  const migrateRes = await axios.post(
    `${API}/collaborative-wishlists/migrate-legacy`,
    {
      items: [{ _id: testProduct._id, quantity: 1 }],
    },
    { headers }
  );
  console.log('✅ 10. Legacy Migration endpoint succeeded. Migrated count:', migrateRes.data.migratedCount);

  console.log('🎉 ALL MULTI-WISHLIST CRUD & BATCH TESTS PASSED WITH 100% SUCCESS!');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err.response?.data || err.message);
  process.exit(1);
});

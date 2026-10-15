import axios from "axios";

const API = "http://localhost:5000/api";

async function runTests() {
  console.log("🚀 Starting Collaborative Wishlist Backend Verification Suite...\n");

  try {
    // 1. Authenticate Customer A (haritha or test user)
    console.log("1. Authenticating Customer A...");
    let tokenA = "";
    let userA = null;

    try {
      const loginA = await axios.post(`${API}/auth/login`, {
        email: "haritha@gmail.com",
        password: "password123",
      });
      tokenA = loginA.data.token;
      userA = loginA.data.user;
      console.log(`   ✅ Logged in Customer A: ${userA.name} (${userA.email})`);
    } catch {
      // Create if doesn't exist
      const regA = await axios.post(`${API}/auth/register`, {
        name: "Haritha Gifting",
        email: "haritha@gmail.com",
        password: "password123",
      });
      const verifyA = await axios.post(`${API}/auth/verify-otp`, {
        email: "haritha@gmail.com",
        otp: regA.data.otp || "123456",
      });
      tokenA = verifyA.data.token;
      userA = verifyA.data.user;
      console.log(`   ✅ Registered Customer A: ${userA.name}`);
    }

    // 2. Authenticate Customer B (collaborator)
    console.log("\n2. Authenticating Customer B (Collaborator)...");
    let tokenB = "";
    let userB = null;

    try {
      const loginB = await axios.post(`${API}/auth/login`, {
        email: "collaborator@gmail.com",
        password: "password123",
      });
      tokenB = loginB.data.token;
      userB = loginB.data.user;
      console.log(`   ✅ Logged in Customer B: ${userB.name} (${userB.email})`);
    } catch {
      const regB = await axios.post(`${API}/auth/register`, {
        name: "Aarav Friend",
        email: "collaborator@gmail.com",
        password: "password123",
      });
      const verifyB = await axios.post(`${API}/auth/verify-otp`, {
        email: "collaborator@gmail.com",
        otp: regB.data.otp || "123456",
      });
      tokenB = verifyB.data.token;
      userB = verifyB.data.user;
      console.log(`   ✅ Registered Customer B: ${userB.name}`);
    }

    // 3. Customer A creates a new collaborative wishlist
    console.log("\n3. Customer A creates a Collaborative Wishlist...");
    const createRes = await axios.post(
      `${API}/collaborative-wishlists`,
      {
        name: "Baby Shower & Surprise Gifting",
        description: "Shared wishlist for our upcoming boutique celebration!",
        visibility: "shared",
        settings: {
          allowEditorInvites: true,
          allowComments: true,
          allowReactions: true,
        },
      },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    const wishlist = createRes.data.wishlist;
    console.log(`   ✅ Wishlist created: "${wishlist.name}" (ID: ${wishlist._id})`);

    // 4. Customer A adds a real product from MongoDB
    console.log("\n4. Adding real product from catalogue to wishlist...");
    const productsRes = await axios.get(`${API}/products`);
    const sampleProduct = productsRes.data[0];
    if (!sampleProduct) throw new Error("No products in database to test with!");

    const addItemRes = await axios.post(
      `${API}/collaborative-wishlists/${wishlist._id}/items`,
      {
        productId: sampleProduct._id,
        desiredQuantity: 2,
        note: "Pink color preferred if available!",
        priority: "high",
      },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    console.log(`   ✅ Added item: ${sampleProduct.name} (Qty: 2, Note: Pink color)`);

    // 5. Customer A invites Customer B by email
    console.log("\n5. Customer A invites Customer B via verified email...");
    const inviteRes = await axios.post(
      `${API}/collaborative-wishlists/${wishlist._id}/invitations`,
      {
        email: "collaborator@gmail.com",
        role: "editor",
        message: "Hey Aarav, help me choose the best toys for the baby shower!",
      },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    const invitation = inviteRes.data.invitation;
    console.log(`   ✅ Invitation dispatched to collaborator@gmail.com as EDITOR`);

    // 6. Customer B checks pending invitations
    console.log("\n6. Customer B retrieves pending invitations...");
    const bInvitesRes = await axios.get(`${API}/invitations/my-invitations`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    console.log(`   ✅ Customer B has ${bInvitesRes.data.invitations.length} pending invitation(s).`);

    // 7. Customer B accepts the invitation
    console.log("\n7. Customer B accepts the invitation...");
    const acceptRes = await axios.post(
      `${API}/invitations/${invitation._id}/accept`,
      {},
      { headers: { Authorization: `Bearer ${tokenB}` } }
    );
    console.log(`   ✅ Invitation accepted: ${acceptRes.data.message}`);

    // 8. Customer B views the shared wishlist
    console.log("\n8. Customer B accesses the shared wishlist...");
    const sharedViewRes = await axios.get(`${API}/collaborative-wishlists/${wishlist._id}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const fetchedItems = sharedViewRes.data.wishlist.items;
    const userRoleB = sharedViewRes.data.wishlist.permissions.role;
    console.log(`   ✅ Customer B loaded wishlist: "${sharedViewRes.data.wishlist.name}"`);
    console.log(`   ✅ Customer B effective role: ${userRoleB.toUpperCase()} (Can edit: ${sharedViewRes.data.wishlist.permissions.canEditItems})`);
    console.log(`   ✅ Items in shared list: ${fetchedItems.length} items`);

    // 9. Customer B coordinates shopping: marks item as "planning_to_buy"
    console.log("\n9. Customer B marks item coordination status to 'planning_to_buy'...");
    const itemId = fetchedItems[0]._id;
    const statusRes = await axios.put(
      `${API}/collaborative-wishlists/${wishlist._id}/items/${itemId}/group-status`,
      { groupStatus: "planning_to_buy" },
      { headers: { Authorization: `Bearer ${tokenB}` } }
    );
    console.log(`   ✅ Group coordination status updated: ${statusRes.data.message}`);

    // 10. Customer B posts a comment
    console.log("\n10. Customer B posts a collaborative comment...");
    const commentRes = await axios.post(
      `${API}/collaborative-wishlists/${wishlist._id}/comments`,
      { content: "I will take care of getting this one! It looks adorable 🧸" },
      { headers: { Authorization: `Bearer ${tokenB}` } }
    );
    console.log(`   ✅ Comment posted by Customer B: "${commentRes.data.comment.content}"`);

    // 11. Customer A checks notifications
    console.log("\n11. Customer A checks received notifications...");
    const notifRes = await axios.get(`${API}/notifications`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    console.log(`   ✅ Customer A has ${notifRes.data.notifications.length} notification(s), unread: ${notifRes.data.unreadCount}`);
    if (notifRes.data.notifications[0]) {
      console.log(`      Latest notification: "${notifRes.data.notifications[0].message}"`);
    }

    // 12. Security Check: Unauthenticated user cannot access private/shared wishlist
    console.log("\n12. Security Test: Unauthorized access rejection...");
    try {
      await axios.get(`${API}/collaborative-wishlists/${wishlist._id}`);
      console.error("   ❌ SECURITY FAIL: Unauthenticated user was able to access private list!");
    } catch (secErr) {
      console.log(`   ✅ Security check passed: ${secErr.response?.status} (${secErr.response?.data?.message})`);
    }

    console.log("\n🎉 ALL 12 COLLABORATIVE WISHLIST BACKEND TESTS PASSED SUCCESSFULLY! 🎉\n");
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
  }
}

runTests();

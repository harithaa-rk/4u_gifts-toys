import { useState, useEffect, useRef } from "react";
import axios from "axios";
const API = "http://localhost:5000/api";
// ─── Helpers ────────────────────────────────────────────────────────────────
const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const statusColors = {
  active: { bg: "#e8f5e9", text: "#2e7d32" },
  low_stock: { bg: "#fff8e1", text: "#f57f17" },
  out_of_stock: { bg: "#fce4ec", text: "#c62828" },
  inactive: { bg: "#f5f5f5", text: "#757575" },
};

const DEFAULT_CATEGORY_COLORS = [
  "#fce4ec", "#e3f2fd", "#f3e5f5", "#e8f5e9", "#fff8e1", "#fbe9e7", "#e0f7fa", "#f9fbe7",
];
const EMOJI_OPTIONS = ["🎁", "🍼", "🧸", "💐", "🎩", "🏡", "🎉", "🎀", "🌟", "🧩", "🎮", "🖼", "🌈", "🦄", "🐻", "🎪"];
const emptyProduct = {
  name: "", category: "", subcategory: "", price: "", quantity: "", description: "",
  ageGroup: "", brand: "", sku: "", weight: "", status: "active", tags: "", images: [], model3d: "",
};

const emptyCategory = { label: "", icon: "🎁", color: "#fce4ec", subcategories: "" };

// ─── Input style ─────────────────────────────────────────────────────────────
const inp = {
  width: "100%", padding: "9px 12px", border: "1.5px solid #e0dbd5",
  borderRadius: 9, fontSize: 13, color: "#1a1a2e", background: "#faf9f7",
  boxSizing: "border-box", outline: "none", fontFamily: "inherit",
};

// ─── Sub-components ──────────────────────────────────────────────────────────
function Section({ label, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#f48fb1", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, borderBottom: "1.5px solid #fce4ec", paddingBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}
function Row({ children }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>{children}</div>;
}
function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#666", marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [aboutInfo, setAboutInfo] = useState({ description: "", images: [], stats: [] });
  const [aboutSaving, setAboutSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(null);

  // Orders & Notifications
  const [orders, setOrders] = useState([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotalPages, setOrdersTotalPages] = useState(1);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const [view, setView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toast, setToast] = useState(null);

  // Product modal
  const [productModal, setProductModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [imagePreview, setImagePreview] = useState([]);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef();

  // Category modal
  const [catModal, setCatModal] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [catForm, setCatForm] = useState(emptyCategory);

  // Filters / sort
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortField, setSortField] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteCatConfirm, setDeleteCatConfirm] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Load data ──
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const [prodRes, catRes, aboutRes, notifRes] = await Promise.all([
          axios.get(`${API}/products`),
          axios.get(`${API}/categories`),
          axios.get(`${API}/about`).catch(() => ({ data: { description: "", images: [], stats: [] } })),
          token ? axios.get(`${API}/notifications`, { headers }).catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
        ]);
        setProducts(prodRes.data);
        setCategories(catRes.data);
        if (aboutRes?.data) setAboutInfo({ ...aboutRes.data, stats: aboutRes.data.stats || [] });
        setNotifications(notifRes.data || []);
      } catch (err) {
        console.error(err);
        setDbError("Failed to load data from server.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Fetch paginated orders whenever ordersPage changes
  useEffect(() => {
    if (view === "orders") {
      const fetchOrders = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;
        try {
          const { data } = await axios.get(`${API}/orders/admin?page=${ordersPage}&limit=10`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setOrders(data.orders);
          setOrdersTotalPages(data.totalPages);
        } catch (err) {
          showToast("Failed to load orders.", "error");
        }
      };
      fetchOrders();
    }
  }, [view, ordersPage]);

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await axios.put(`${API}/orders/admin/${orderId}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
      showToast("Order status updated successfully", "success");
    } catch (err) {
      showToast("Failed to update status", "error");
    }
  };

  const handleUpdatePaymentStatus = async (orderId, newStatus) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await axios.put(`${API}/orders/admin/${orderId}/payment`, { paymentStatus: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, paymentStatus: newStatus } : o));
      showToast("Payment status updated successfully", "success");
    } catch (err) {
      showToast("Failed to update payment status", "error");
    }
  };

  const markAllNotificationsRead = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await axios.put(`${API}/notifications/read-all`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setShowNotifications(false);
    } catch (err) {
      console.error(err);
    }
  };

  // ── Image handling ──
  const handleImageFiles = async (files) => {
    const arr = Array.from(files).slice(0, 5);
    const encoded = await Promise.all(arr.map(toBase64));
    setImagePreview(prev => [...prev, ...encoded].slice(0, 5));
    setForm(f => ({ ...f, images: [...(f.images || []), ...encoded].slice(0, 5) }));
  };

  const removeImage = (idx) => {
    setImagePreview(prev => prev.filter((_, i) => i !== idx));
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  };

  // ── Open product modal ──
  const openAdd = () => {
    setEditProduct(null);
    setForm(emptyProduct);
    setImagePreview([]);
    setProductModal(true);
  };
  const openEdit = (p) => {
    setEditProduct(p);
    setForm({ ...p, tags: (p.tags || []).join(", "), model3d: p.model3d || "" });
    setImagePreview(p.images || []);
    setProductModal(true);
  };

  // ── Save product ──
  const handleSaveProduct = async () => {
    if (!form.name || !form.price || !form.quantity) {
      showToast("Please fill required fields", "error");
      return;
    }

    const productData = {
      ...form,
      tags: form.tags ? form.tags.split(",").map(t => t.trim()) : [],
    };

    setSaving(true);
    try {
      if (editProduct?._id) {
        await axios.put(`${API}/products/${editProduct._id}`, productData);
        setProducts(prev =>
          prev.map(p =>
            p._id === editProduct._id ? { ...productData, _id: editProduct._id } : p
          )
        );
        showToast("Product updated!");
      } else {
        const res = await axios.post(`${API}/products`, productData);
        setProducts(prev => [...prev, res.data]);
        showToast("Product added!");
      }
      setProductModal(false);
    } catch (err) {
      showToast("Save failed: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete product ──
  const handleDelete = async (p) => {
    try {
      await axios.delete(`${API}/products/${p._id}`);
      setProducts(prev => prev.filter(x => x._id !== p._id));
      showToast("Product deleted.", "info");
    } catch (err) {
      console.error(err);
      showToast("Delete failed: " + err.message, "error");
    }
    setDeleteConfirm(null);
  };

  // ── Category CRUD ──
  const openAddCat = () => { setEditCat(null); setCatForm(emptyCategory); setCatModal(true); };
  const openEditCat = (c) => {
    setEditCat(c);
    setCatForm({ ...c, subcategories: (c.subcategories || []).join(", ") });
    setCatModal(true);
  };

  const handleSaveCategory = async () => {
    if (!catForm.label) {
      showToast("Category name required.", "error");
      return;
    }

    const subsArr = catForm.subcategories
      ? catForm.subcategories.split(",").map(s => s.trim()).filter(Boolean)
      : [];

    const doc = {
      ...catForm,
      subcategories: subsArr,
      id: catForm.label.toLowerCase().replace(/\s+/g, "_"),
    };

    try {
      if (editCat?._id) {
        await axios.put(`${API}/categories/${editCat._id}`, doc);
        setCategories(prev =>
          prev.map(c => c._id === editCat._id ? { ...doc, _id: editCat._id } : c)
        );
        showToast("Category updated!");
      } else {
        const res = await axios.post(`${API}/categories`, doc);
        setCategories(prev => [...prev, res.data]);
        showToast("Category added!");
      }
      setCatModal(false);
    } catch (e) {
      showToast("Save failed: " + e.message, "error");
    }
  };

  const handleDeleteCat = async (c) => {
    try {
      await axios.delete(`${API}/categories/${c._id}`);
      setCategories(prev => prev.filter(x => x._id !== c._id));
      showToast("Category deleted.", "info");
    } catch (e) {
      showToast("Delete failed: " + e.message, "error");
    }
    setDeleteCatConfirm(null);
  };

  // ── Sort / filter ──
  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const filtered = products
    .filter(p => {
      const q = search.toLowerCase();
      return (
        (!q || (p.name || "").toLowerCase().includes(q) || (p.sku || "").toLowerCase().includes(q) || (p.brand || "").toLowerCase().includes(q)) &&
        (filterCat === "all" || p.category === filterCat) &&
        (filterStatus === "all" || p.status === filterStatus)
      );
    })
    .sort((a, b) => {
      let av = a[sortField] ?? "", bv = b[sortField] ?? "";
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      return sortDir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });

  const filteredOrders = orders.filter(o => {
    const q = search.toLowerCase();
    return !q || 
           o._id.toLowerCase().includes(q) || 
           (o.userId?.name || "").toLowerCase().includes(q) || 
           (o.userId?.email || "").toLowerCase().includes(q);
  });

  const getCat = (id) => categories.find(c => c.id === id);

  const stats = {
    total: products.length,
    active: products.filter(p => p.status === "active").length,
    lowStock: products.filter(p => p.status === "low_stock" || (p.status === "active" && p.quantity < 10)).length,
    totalValue: products.reduce((s, p) => s + (+p.price) * (+p.quantity), 0),
    cats: categories.length,
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "▦" },
    { id: "orders", label: "Orders", icon: "🛍" },
    { id: "payments", label: "Payments", icon: "💳" },
    { id: "products", label: "Products", icon: "📦" },
    { id: "categories", label: "Categories", icon: "🗂" },
    { id: "about", label: "Shop Profile", icon: "🏢" },
  ];

  const SortIcon = ({ field }) => (
    <span style={{ fontSize: 10, marginLeft: 4, opacity: sortField === field ? 1 : 0.3 }}>
      {sortField === field ? (sortDir === "asc" ? "▲" : "▼") : "⇅"}
    </span>
  );

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif", background: "#f7f4f1", position: "relative" }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 24, right: 24, zIndex: 9999, background: toast.type === "error" ? "#c62828" : toast.type === "info" ? "#1565c0" : "#2e7d32", color: "#fff", padding: "12px 22px", borderRadius: 10, fontSize: 14, fontWeight: 500, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
          {toast.msg}
        </div>
      )}

      {/* Sidebar */}
      <aside style={{ width: sidebarOpen ? 230 : 64, background: "#1a1a2e", color: "#fff", display: "flex", flexDirection: "column", transition: "width 0.25s", overflow: "hidden", flexShrink: 0 }}>
        <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>🎁</span>
          {sidebarOpen && <span style={{ fontWeight: 700, fontSize: 15, whiteSpace: "nowrap", background: "linear-gradient(90deg,#f48fb1,#ce93d8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>4U Toys and Gifts</span>}
        </div>
        {navItems.map(n => (
          <button key={n.id} onClick={() => setView(n.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", background: view === n.id ? "rgba(255,255,255,0.12)" : "transparent", border: "none", color: view === n.id ? "#f48fb1" : "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: 14, fontWeight: view === n.id ? 600 : 400, borderLeft: view === n.id ? "3px solid #f48fb1" : "3px solid transparent", transition: "all 0.2s", textAlign: "left", width: "100%" }}>
            <span style={{ fontSize: 18 }}>{n.icon}</span>
            {sidebarOpen && <span style={{ whiteSpace: "nowrap" }}>{n.label}</span>}
          </button>
        ))}
        <div style={{ marginTop: "auto", padding: 16 }}>
          <button onClick={() => setSidebarOpen(s => !s)} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#fff", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 13, width: "100%" }}>
            {sidebarOpen ? "◀ Collapse" : "▶"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>
        {/* Header */}
        <header style={{ background: "#fff", padding: "16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #ede8e3", position: "sticky", top: 0, zIndex: 100 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1a1a2e" }}>
              {view === "dashboard" ? "Dashboard Overview" : view === "orders" ? "Order Management" : view === "products" ? "Product Management" : view === "about" ? "Shop Profile" : "Categories"}
            </h1>
            <p style={{ margin: 0, fontSize: 12, color: "#888" }}>4U Toys and Treats</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Notifications Bell */}
            <div style={{ position: "relative" }}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                style={{ background: "#f5f2ef", border: "none", borderRadius: "50%", width: 40, height: 40, cursor: "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                🔔
                {notifications.filter(n => !n.read).length > 0 && (
                  <span style={{ position: "absolute", top: -2, right: -2, background: "#e53935", color: "#fff", fontSize: 10, fontWeight: "bold", width: 18, height: 18, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div style={{ position: "absolute", top: 50, right: 0, width: 320, background: "#fff", borderRadius: 14, boxShadow: "0 10px 40px rgba(0,0,0,0.15)", border: "1px solid #ede8e3", zIndex: 200, overflow: "hidden" }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #ede8e3", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#faf9f7" }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>Notifications</div>
                    <button onClick={markAllNotificationsRead} style={{ background: "none", border: "none", color: "#1565c0", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Mark all read</button>
                  </div>
                  <div style={{ maxHeight: 300, overflowY: "auto", padding: 8 }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: 20, textAlign: "center", color: "#aaa", fontSize: 13 }}>No notifications</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n._id} style={{ padding: "12px 10px", borderBottom: "1px solid #f5f2ef", background: n.read ? "#fff" : "#f0f8ff", borderRadius: 8, marginBottom: 4 }}>
                          <div style={{ fontSize: 13, color: "#333", fontWeight: n.read ? 400 : 600 }}>{n.message}</div>
                          <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>{new Date(n.createdAt).toLocaleString()}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {view === "products" && <button onClick={openAdd} style={{ background: "#1a1a2e", color: "#f48fb1", border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>+ Add Product</button>}
            {view === "categories" && <button onClick={openAddCat} style={{ background: "#1a1a2e", color: "#f48fb1", border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>+ Add Category</button>}
          </div>
        </header>

        <main style={{ padding: 28, flex: 1 }}>

          {/* Loading / Error state */}
          {loading && (
            <div style={{ textAlign: "center", padding: 80, color: "#aaa", fontSize: 16 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
              Connecting to server…
            </div>
          )}
          {dbError && !loading && (
            <div style={{ background: "#fce4ec", border: "1.5px solid #f48fb1", borderRadius: 14, padding: "24px 28px", color: "#c62828", marginBottom: 24 }}>
              <strong>Connection Error:</strong> {dbError}
              <br /><span style={{ fontSize: 13, color: "#555", marginTop: 6, display: "block" }}>Check that your backend server is running at <code>{API}</code>.</span>
            </div>
          )}

          {!loading && (
            <>
              {/* DASHBOARD */}
              {view === "dashboard" && (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 16, marginBottom: 28 }}>
                    {[
                      { label: "Total Products", value: stats.total, icon: "📦", color: "#e3f2fd" },
                      { label: "Active Products", value: stats.active, icon: "✅", color: "#e8f5e9" },
                      { label: "Low / Out of Stock", value: stats.lowStock, icon: "⚠️", color: "#fff8e1" },
                      { label: "Inventory Value", value: `₹${stats.totalValue.toLocaleString("en-IN")}`, icon: "💰", color: "#fce4ec" },
                      { label: "Categories", value: stats.cats, icon: "🗂", color: "#f3e5f5" },
                    ].map(s => (
                      <div key={s.label} style={{ background: s.color, borderRadius: 14, padding: "18px 20px" }}>
                        <div style={{ fontSize: 24 }}>{s.icon}</div>
                        <div style={{ fontSize: 26, fontWeight: 700, color: "#1a1a2e", margin: "8px 0 2px" }}>{s.value}</div>
                        <div style={{ fontSize: 12, color: "#555" }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1a1a2e", marginBottom: 14 }}>Recent Products</h2>
                  {products.length === 0 ? (
                    <div style={{ background: "#fff", borderRadius: 14, padding: 40, textAlign: "center", color: "#bbb", fontSize: 15 }}>No products yet. Add your first product!</div>
                  ) : (
                    <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", border: "1px solid #ede8e3" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                          <tr style={{ background: "#faf9f7" }}>
                            {["Name", "Category", "Price", "Qty", "Status"].map(h => (
                              <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#555", borderBottom: "1px solid #ede8e3" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {products.slice(0, 8).map((p, index) => {
                            const cat = getCat(p.category);
                            const sc = statusColors[p.status] || statusColors.active;
                            return (
                              <tr key={p._id || index} style={{ borderBottom: "1px solid #f5f2ef" }}>
                                <td style={{ padding: "11px 16px", fontWeight: 500, display: "flex", alignItems: "center", gap: 10 }}>
                                  {p.images?.[0] && <img src={p.images[0]} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />}
                                  {p.name}
                                </td>
                                <td style={{ padding: "11px 16px" }}>{cat ? <span style={{ background: cat.color, borderRadius: 6, padding: "3px 10px", fontSize: 12 }}>{cat.icon} {cat.label}</span> : p.category}</td>
                                <td style={{ padding: "11px 16px" }}>₹{(+p.price).toLocaleString("en-IN")}</td>
                                <td style={{ padding: "11px 16px" }}>{p.quantity}</td>
                                <td style={{ padding: "11px 16px" }}><span style={{ background: sc.bg, color: sc.text, borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 600, textTransform: "capitalize" }}>{(p.status || "").replace("_", " ")}</span></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ORDERS */}
              {view === "orders" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                    <div style={{ fontSize: 14, color: "#555" }}>Manage customer orders</div>
                  </div>
                  
                  {filteredOrders.length === 0 ? (
                    <div style={{ background: "#fff", borderRadius: 14, padding: 60, textAlign: "center", color: "#bbb", fontSize: 15 }}>
                      <div style={{ fontSize: 40, marginBottom: 12 }}>🛍</div>
                      No orders match your search.
                    </div>
                  ) : (
                    <>
                      <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", border: "1px solid #ede8e3" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                          <thead>
                            <tr style={{ background: "#faf9f7" }}>
                              <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#555", borderBottom: "1px solid #ede8e3" }}>Order ID</th>
                              <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#555", borderBottom: "1px solid #ede8e3" }}>Customer</th>
                              <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#555", borderBottom: "1px solid #ede8e3" }}>Date</th>
                              <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#555", borderBottom: "1px solid #ede8e3" }}>Total</th>
                              <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#555", borderBottom: "1px solid #ede8e3" }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredOrders.map((o) => (
                              <tr key={o._id} style={{ borderBottom: "1px solid #f5f2ef" }}>
                                <td style={{ padding: "14px 16px", fontFamily: "monospace", color: "#666" }}>
                                  <div style={{ marginBottom: "8px", fontWeight: "bold" }}>{o._id}</div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {o.products?.map((p, idx) => (
                                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <img src={p.productId?.images?.[0] || 'https://placehold.co/40x40?text=🎁'} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover', border: '1px solid #eee' }} />
                                        <div style={{ fontSize: 11, color: '#555', lineHeight: 1.2 }}>
                                          <span style={{ fontWeight: 700, color: '#1a1a2e' }}>{p.quantity}x</span> {p.productId?.name || 'Unknown Product'}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </td>
                                <td style={{ padding: "14px 16px" }}>
                                  <div style={{ fontWeight: 600, color: "#1a1a2e" }}>{o.userId?.name || "Unknown"}</div>
                                  <div style={{ fontSize: 11, color: "#888" }}>{o.userId?.email || ""}</div>
                                  {o.shippingAddress && (
                                    <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>
                                      {o.shippingAddress.address}, {o.shippingAddress.city} - {o.shippingAddress.postalCode}
                                      <br/>📞 {o.shippingAddress.phone}
                                    </div>
                                  )}
                                </td>
                                <td style={{ padding: "14px 16px", color: "#555" }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                                <td style={{ padding: "14px 16px", fontWeight: 700, color: "#2e7d32" }}>₹{o.totalAmount?.toLocaleString("en-IN")}</td>
                                <td style={{ padding: "14px 16px" }}>
                                  <select 
                                    value={o.status || 'Pending'} 
                                    onChange={(e) => handleUpdateOrderStatus(o._id, e.target.value)}
                                    style={{
                                      background: o.status === "Pending" ? "#fff8e1" : o.status === "Processing" ? "#e3f2fd" : o.status === "Shipped" ? "#f3e5f5" : "#e8f5e9",
                                      color: o.status === "Pending" ? "#f57f17" : o.status === "Processing" ? "#1976d2" : o.status === "Shipped" ? "#7b1fa2" : "#2e7d32",
                                      border: "1px solid transparent",
                                      borderRadius: 6, padding: "4px 8px", fontSize: 12, fontWeight: 600,
                                      outline: "none", cursor: "pointer"
                                    }}
                                  >
                                    <option value="Pending">Pending</option>
                                    <option value="Processing">Processing</option>
                                    <option value="Shipped">Shipped</option>
                                    <option value="Delivered">Delivered</option>
                                  </select>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div style={{ display: "flex", justifyContent: "center", gap: 15, marginTop: 20, alignItems: "center" }}>
                        <button 
                          disabled={ordersPage <= 1} 
                          onClick={() => setOrdersPage(p => p - 1)}
                          style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #ede8e3", background: "#fff", cursor: ordersPage <= 1 ? "not-allowed" : "pointer", opacity: ordersPage <= 1 ? 0.5 : 1 }}
                        >
                          Previous
                        </button>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#555" }}>
                          Page {ordersPage} of {ordersTotalPages}
                        </span>
                        <button 
                          disabled={ordersPage >= ordersTotalPages} 
                          onClick={() => setOrdersPage(p => p + 1)}
                          style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #ede8e3", background: "#fff", cursor: ordersPage >= ordersTotalPages ? "not-allowed" : "pointer", opacity: ordersPage >= ordersTotalPages ? 0.5 : 1 }}
                        >
                          Next
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* PAYMENTS */}
              {view === "payments" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                    <div style={{ fontSize: 14, color: "#555" }}>Manage customer payments & transactions</div>
                  </div>
                  
                  {filteredOrders.length === 0 ? (
                    <div style={{ background: "#fff", borderRadius: 14, padding: 60, textAlign: "center", color: "#bbb", fontSize: 15 }}>
                      <div style={{ fontSize: 40, marginBottom: 12 }}>💳</div>
                      No transactions match your search.
                    </div>
                  ) : (
                    <>
                      <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", border: "1px solid #ede8e3" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                          <thead>
                            <tr style={{ background: "#faf9f7" }}>
                              <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#555", borderBottom: "1px solid #ede8e3" }}>Transaction / Order ID</th>
                              <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#555", borderBottom: "1px solid #ede8e3" }}>Customer</th>
                              <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#555", borderBottom: "1px solid #ede8e3" }}>Amount</th>
                              <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#555", borderBottom: "1px solid #ede8e3" }}>Method</th>
                              <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#555", borderBottom: "1px solid #ede8e3" }}>Payment Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredOrders.map((o) => (
                              <tr key={o._id} style={{ borderBottom: "1px solid #f5f2ef" }}>
                                <td style={{ padding: "14px 16px", fontFamily: "monospace", color: "#666" }}>
                                  <div style={{ fontWeight: 600 }}>{o._id}</div>
                                  <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
                                    {new Date(o.createdAt).toLocaleDateString()} at {new Date(o.createdAt).toLocaleTimeString()}
                                  </div>
                                </td>
                                <td style={{ padding: "14px 16px" }}>
                                  <div style={{ fontWeight: 600, color: "#1a1a2e" }}>{o.userId?.name || "Unknown"}</div>
                                  <div style={{ fontSize: 11, color: "#888" }}>{o.userId?.email || ""}</div>
                                </td>
                                <td style={{ padding: "14px 16px", fontWeight: 700, color: "#2e7d32" }}>₹{o.totalAmount?.toLocaleString("en-IN")}</td>
                                <td style={{ padding: "14px 16px", fontWeight: 600, textTransform: 'uppercase', color: o.paymentMethod === 'cod' ? '#f57f17' : '#1565c0' }}>
                                  {o.paymentMethod || 'CARD'}
                                </td>
                                <td style={{ padding: "14px 16px" }}>
                                  <select 
                                    value={o.paymentStatus || 'Pending'} 
                                    onChange={(e) => handleUpdatePaymentStatus(o._id, e.target.value)}
                                    style={{
                                      background: o.paymentStatus === "Pending" ? "#fff8e1" : o.paymentStatus === "Paid" ? "#e8f5e9" : o.paymentStatus === "Failed" ? "#ffebee" : "#f3e5f5",
                                      color: o.paymentStatus === "Pending" ? "#f57f17" : o.paymentStatus === "Paid" ? "#2e7d32" : o.paymentStatus === "Failed" ? "#c62828" : "#7b1fa2",
                                      border: "1px solid transparent",
                                      borderRadius: 6, padding: "4px 8px", fontSize: 12, fontWeight: 600,
                                      outline: "none", cursor: "pointer"
                                    }}
                                  >
                                    <option value="Pending">Pending</option>
                                    <option value="Paid">Paid</option>
                                    <option value="Failed">Failed</option>
                                    <option value="Refunded">Refunded</option>
                                  </select>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div style={{ display: "flex", justifyContent: "center", gap: 15, marginTop: 20, alignItems: "center" }}>
                        <button 
                          disabled={ordersPage <= 1} 
                          onClick={() => setOrdersPage(p => p - 1)}
                          style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #ede8e3", background: "#fff", cursor: ordersPage <= 1 ? "not-allowed" : "pointer", opacity: ordersPage <= 1 ? 0.5 : 1 }}
                        >
                          Previous
                        </button>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#555" }}>
                          Page {ordersPage} of {ordersTotalPages}
                        </span>
                        <button 
                          disabled={ordersPage >= ordersTotalPages} 
                          onClick={() => setOrdersPage(p => p + 1)}
                          style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #ede8e3", background: "#fff", cursor: ordersPage >= ordersTotalPages ? "not-allowed" : "pointer", opacity: ordersPage >= ordersTotalPages ? 0.5 : 1 }}
                        >
                          Next
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* PRODUCTS */}
              {view === "products" && (
                <div>
                  <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
                    <input placeholder="Search by name, SKU, brand…" value={search} onChange={e => setSearch(e.target.value)} style={{ ...inp, width: 240, padding: "9px 14px" }} />
                    <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ ...inp, width: 200 }}>
                      <option value="all">All Categories</option>
                      {categories.map(c => <option key={c._id} value={c.id}>{c.icon} {c.label}</option>)}
                    </select>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inp, width: 160 }}>
                      <option value="all">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="low_stock">Low Stock</option>
                      <option value="out_of_stock">Out of Stock</option>
                      <option value="inactive">Inactive</option>
                    </select>
                    <span style={{ marginLeft: "auto", fontSize: 13, color: "#777" }}>{filtered.length} product{filtered.length !== 1 ? "s" : ""}</span>
                  </div>

                  <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", border: "1px solid #ede8e3" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: "#faf9f7" }}>
                          {[["name", "Name"], ["category", "Category"], ["price", "Price"], ["quantity", "Qty"], ["status", "Status"], ["brand", "Brand"]].map(([f, l]) => (
                            <th key={f} onClick={() => handleSort(f)} style={{ padding: "12px 14px", textAlign: "left", fontWeight: 600, color: "#555", borderBottom: "1px solid #ede8e3", cursor: "pointer", userSelect: "none" }}>
                              {l}<SortIcon field={f} />
                            </th>
                          ))}
                          <th style={{ padding: "12px 14px", borderBottom: "1px solid #ede8e3", color: "#555", fontWeight: 600 }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.length === 0 ? (
                          <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#aaa", fontSize: 15 }}>No products found.</td></tr>
                        ) : filtered.map((p, index) => {
                          const cat = getCat(p.category);
                          const sc = statusColors[p.status] || statusColors.active;
                          return (
                            <tr key={p._id || index} style={{ borderBottom: "1px solid #f5f2ef" }} onMouseEnter={e => e.currentTarget.style.background = "#fdfcfb"} onMouseLeave={e => e.currentTarget.style.background = ""}>
                              <td style={{ padding: "11px 14px", fontWeight: 600, color: "#1a1a2e" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  {p.images?.[0]
                                    ? <img src={p.images[0]} alt="" style={{ width: 38, height: 38, borderRadius: 8, objectFit: "cover", flexShrink: 0, border: "1.5px solid #ede8e3" }} />
                                    : <div style={{ width: 38, height: 38, borderRadius: 8, background: "#f0ece8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{cat?.icon || "🎁"}</div>
                                  }
                                  <div>
                                    {p.name}
                                    {(p.tags || []).map(t => <span key={t} style={{ marginLeft: 6, background: "#fce4ec", color: "#c2185b", fontSize: 10, padding: "2px 7px", borderRadius: 5, fontWeight: 500 }}>{t}</span>)}
                                    <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>SKU: {p.sku || "—"}</div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: "11px 14px" }}>{cat ? <span style={{ background: cat.color, borderRadius: 6, padding: "3px 10px", fontSize: 11 }}>{cat.icon} {cat.label}</span> : p.category}</td>
                              <td style={{ padding: "11px 14px", fontWeight: 600 }}>₹{(+p.price).toLocaleString("en-IN")}</td>
                              <td style={{ padding: "11px 14px", color: p.quantity < 10 ? "#e53935" : "#333", fontWeight: p.quantity < 10 ? 700 : 400 }}>{p.quantity}</td>
                              <td style={{ padding: "11px 14px" }}><span style={{ background: sc.bg, color: sc.text, borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 600, textTransform: "capitalize" }}>{(p.status || "").replace("_", " ")}</span></td>
                              <td style={{ padding: "11px 14px", color: "#555" }}>{p.brand || "—"}</td>
                              <td style={{ padding: "11px 14px" }}>
                                <div style={{ display: "flex", gap: 6 }}>
                                  <button onClick={() => openEdit(p)} style={{ background: "#e3f2fd", color: "#1565c0", border: "none", borderRadius: 7, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Edit</button>
                                  <button onClick={() => setDeleteConfirm(p)} style={{ background: "#fce4ec", color: "#c62828", border: "none", borderRadius: 7, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Delete</button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* CATEGORIES */}
              {view === "categories" && (
                <div>
                  {categories.length === 0 ? (
                    <div style={{ background: "#fff", borderRadius: 14, padding: 60, textAlign: "center", color: "#bbb", fontSize: 15 }}>
                      <div style={{ fontSize: 40, marginBottom: 12 }}>🗂</div>
                      No categories yet. Click <strong>+ Add Category</strong> to create one.
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
                      {categories.map(c => {
                        const count = products.filter(p => p.category === c.id).length;
                        return (
                          <div key={c._id} style={{ background: "#fff", borderRadius: 16, border: "1px solid #ede8e3", overflow: "hidden" }}>
                            <div style={{ background: c.color, padding: "20px 22px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <span style={{ fontSize: 32 }}>{c.icon}</span>
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e" }}>{c.label}</div>
                                  <div style={{ fontSize: 12, color: "#666" }}>{count} product{count !== 1 ? "s" : ""}</div>
                                </div>
                              </div>
                              <div style={{ display: "flex", gap: 6 }}>
                                <button onClick={() => openEditCat(c)} style={{ background: "rgba(255,255,255,0.7)", border: "none", borderRadius: 7, padding: "5px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#1565c0" }}>Edit</button>
                                <button onClick={() => setDeleteCatConfirm(c)} style={{ background: "rgba(255,255,255,0.7)", border: "none", borderRadius: 7, padding: "5px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#c62828" }}>Delete</button>
                              </div>
                            </div>
                            <div style={{ padding: "14px 22px 18px" }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Subcategories</div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {(c.subcategories || []).length === 0
                                  ? <span style={{ color: "#bbb", fontSize: 12 }}>None added</span>
                                  : (c.subcategories || []).map(s => <span key={s} style={{ background: "#f5f2ef", color: "#555", borderRadius: 6, padding: "4px 10px", fontSize: 12 }}>{s}</span>)
                                }
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ABOUT SECTION */}
              {view === "about" && (
                <div style={{ background: "#fff", borderRadius: 14, padding: 28, border: "1px solid #ede8e3", maxWidth: 800 }}>
                  <h2 style={{ fontSize: 18, marginTop: 0, marginBottom: 20 }}>Edit Shop Profile</h2>

                  <Field label="Description">
                    <textarea
                      value={aboutInfo.description}
                      onChange={e => setAboutInfo(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Welcome to 4U Toys and Treats..."
                      rows={5}
                      style={{ ...inp, resize: "vertical", marginBottom: 20 }}
                    />
                  </Field>

                  <Section label="Company Images">
                    <div
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.multiple = true;
                        input.accept = "image/*";
                        input.onchange = async (e) => {
                          const files = Array.from(e.target.files).slice(0, 5 - (aboutInfo.images?.length || 0));
                          const encoded = await Promise.all(files.map(toBase64));
                          setAboutInfo(prev => ({ ...prev, images: [...(prev.images || []), ...encoded].slice(0, 5) }));
                        };
                        input.click();
                      }}
                      style={{ border: "2px dashed #e0dbd5", borderRadius: 12, padding: "20px", textAlign: "center", cursor: "pointer", background: "#faf9f7", marginBottom: 14 }}
                    >
                      <div style={{ fontSize: 28, marginBottom: 6 }}>📷</div>
                      <div style={{ fontSize: 13, color: "#666" }}>Click to upload company images (up to 5)</div>
                    </div>
                    {aboutInfo.images?.length > 0 && (
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
                        {aboutInfo.images.map((src, i) => (
                          <div key={i} style={{ position: "relative", width: 100, height: 100 }}>
                            <img src={src} alt="" style={{ width: 100, height: 100, borderRadius: 10, objectFit: "cover", border: "2px solid #ede8e3" }} />
                            <button onClick={() => setAboutInfo(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))} style={{ position: "absolute", top: -6, right: -6, background: "#c62828", color: "#fff", border: "none", borderRadius: "50%", width: 20, height: 20, fontSize: 12, cursor: "pointer" }}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </Section>

                  <Section label="Shop Statistics (Graphs)">
                    {aboutInfo.stats?.map((stat, idx) => (
                      <div key={idx} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "center" }}>
                        <input value={stat.label} onChange={e => {
                          const newStats = [...aboutInfo.stats];
                          newStats[idx].label = e.target.value;
                          setAboutInfo(prev => ({ ...prev, stats: newStats }));
                        }} placeholder="Label (e.g. Happy Customers)" style={{ ...inp, flex: 2 }} />
                        <input type="number" value={stat.value} onChange={e => {
                          const newStats = [...aboutInfo.stats];
                          newStats[idx].value = Number(e.target.value);
                          setAboutInfo(prev => ({ ...prev, stats: newStats }));
                        }} placeholder="Value" style={{ ...inp, flex: 1 }} />
                        <input value={stat.suffix || ""} onChange={e => {
                          const newStats = [...aboutInfo.stats];
                          newStats[idx].suffix = e.target.value;
                          setAboutInfo(prev => ({ ...prev, stats: newStats }));
                        }} placeholder="Suffix (e.g. +, %)" style={{ ...inp, flex: 1 }} />
                        <button onClick={() => {
                          setAboutInfo(prev => ({ ...prev, stats: prev.stats.filter((_, i) => i !== idx) }));
                        }} style={{ background: "#fce4ec", color: "#c62828", border: "none", borderRadius: 8, padding: "9px 12px", cursor: "pointer" }}>✕</button>
                      </div>
                    ))}
                    <button onClick={() => setAboutInfo(prev => ({ ...prev, stats: [...(prev.stats || []), { label: "", value: 0, suffix: "" }] }))} style={{ background: "#f5f2ef", color: "#555", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, marginTop: 10 }}>+ Add Statistic</button>
                  </Section>

                  <div style={{ marginTop: 30, textAlign: "right" }}>
                    <button
                      onClick={async () => {
                        setAboutSaving(true);
                        try {
                          await axios.put(`${API}/about`, aboutInfo);
                          showToast("Shop Profile saved!");
                        } catch (e) {
                          showToast("Save failed: " + e.message, "error");
                        } finally {
                          setAboutSaving(false);
                        }
                      }}
                      disabled={aboutSaving}
                      style={{ background: "#1a1a2e", color: "#f48fb1", border: "none", borderRadius: 10, padding: "12px 24px", cursor: "pointer", fontWeight: 700 }}
                    >
                      {aboutSaving ? "Saving..." : "Save Profile"}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* ── PRODUCT MODAL ────────────────────────────────────────────────────── */}
      {productModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 700, maxHeight: "92vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
            <div style={{ padding: "22px 28px 16px", borderBottom: "1px solid #ede8e3", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#fff", zIndex: 10 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1a1a2e" }}>{editProduct ? "Edit Product" : "Add New Product"}</h2>
              <button onClick={() => setProductModal(false)} style={{ background: "#f5f2ef", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 18, color: "#555" }}>✕</button>
            </div>
            <div style={{ padding: "22px 28px 28px" }}>

              {/* Images */}
              <Section label="Product Images">
                <div
                  onClick={() => fileInputRef.current.click()}
                  onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = "#f48fb1"; }}
                  onDragLeave={e => { e.currentTarget.style.borderColor = "#e0dbd5"; }}
                  onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = "#e0dbd5"; handleImageFiles(e.dataTransfer.files); }}
                  style={{ border: "2px dashed #e0dbd5", borderRadius: 12, padding: "20px", textAlign: "center", cursor: "pointer", background: "#faf9f7", marginBottom: 14, transition: "border-color 0.2s" }}
                >
                  <div style={{ fontSize: 28, marginBottom: 6 }}>📷</div>
                  <div style={{ fontSize: 13, color: "#666" }}>Click or drag & drop images (up to 5)</div>
                  <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>JPG, PNG, WEBP — stored as base64</div>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => handleImageFiles(e.target.files)} />
                </div>
                {imagePreview.length > 0 && (
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {imagePreview.map((src, i) => (
                      <div key={i} style={{ position: "relative", width: 80, height: 80 }}>
                        <img src={src} alt="" style={{ width: 80, height: 80, borderRadius: 10, objectFit: "cover", border: "2px solid #ede8e3" }} />
                        <button onClick={() => removeImage(i)} style={{ position: "absolute", top: -6, right: -6, background: "#c62828", color: "#fff", border: "none", borderRadius: "50%", width: 20, height: 20, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>✕</button>
                        {i === 0 && <div style={{ position: "absolute", bottom: 2, left: 2, background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: 9, borderRadius: 4, padding: "1px 5px" }}>Main</div>}
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              <Section label="Basic Information">
                <Row>
                  <Field label="Product Name *">
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Rainbow Stacking Rings" style={inp} />
                  </Field>
                  <Field label="Brand">
                    <input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} placeholder="e.g. TinyJoy" style={inp} />
                  </Field>
                </Row>
                <Field label="Description">
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Product description…" rows={3} style={{ ...inp, resize: "vertical" }} />
                </Field>
              </Section>

              <Section label="Category">
                <Row>
                  <Field label="Category *">
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value, subcategory: "" }))} style={inp}>
                      <option value="">Select category</option>
                      {categories.map(c => <option key={c._id} value={c.id}>{c.icon} {c.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Subcategory">
                    <select value={form.subcategory} onChange={e => setForm(f => ({ ...f, subcategory: e.target.value }))} style={inp}>
                      <option value="">Select subcategory</option>
                      {(categories.find(c => c.id === form.category)?.subcategories || []).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                </Row>
                <Field label="Age Group">
                  <select value={form.ageGroup} onChange={e => setForm(f => ({ ...f, ageGroup: e.target.value }))} style={inp}>
                    <option value="">Select age group</option>
                    {["0–12 months", "1–2 years", "3–6 years", "7–12 years", "Teen", "Adult", "All ages"].map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </Field>
              </Section>

              <Section label="Pricing & Inventory">
                <Row>
                  <Field label="Price (₹) *">
                    <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0" style={inp} min={0} />
                  </Field>
                  <Field label="Quantity Available *">
                    <input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} placeholder="0" style={inp} min={0} />
                  </Field>
                </Row>
              </Section>

              <Section label="Product Details">
                <Row>
                  <Field label="SKU">
                    <input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="e.g. TJ-001" style={inp} />
                  </Field>
                  <Field label="Weight">
                    <input value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} placeholder="e.g. 0.5 kg" style={inp} />
                  </Field>
                </Row>
                <Row>
                  <Field label="Status">
                    <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={inp}>
                      <option value="active">Active</option>
                      <option value="low_stock">Low Stock</option>
                      <option value="out_of_stock">Out of Stock</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </Field>
                  <Field label="Tags (comma-separated)">
                    <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="bestseller, eco-friendly" style={inp} />
                  </Field>
                </Row>
              </Section>

              {/* ── 3D / AR Model ── */}
              <Section label="3D / AR Model">
                <Field label="3D Model URL (.glb / Cloudinary URL)">
                  <input
                    value={form.model3d || ""}
                    onChange={e => setForm(f => ({ ...f, model3d: e.target.value }))}
                    placeholder="https://res.cloudinary.com/…/model.glb  or  leave blank"
                    style={inp}
                  />
                  <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>
                    Paste a Cloudinary raw URL or any public .glb URL. Customers will see this in 3D / AR on the product page.
                  </div>
                </Field>

                {/* File upload + remove — only available when editing a saved product */}
                {editProduct?._id && (
                  <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
                    {/* Upload .glb file */}
                    <label
                      htmlFor="model3d-upload"
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 7,
                        background: "#e3f2fd", color: "#1565c0", border: "none",
                        borderRadius: 8, padding: "8px 16px", cursor: "pointer",
                        fontSize: 13, fontWeight: 600,
                      }}
                    >
                      📤 Upload .glb File
                    </label>
                    <input
                      id="model3d-upload"
                      type="file"
                      accept=".glb,.gltf,.usdz"
                      style={{ display: "none" }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const fd = new FormData();
                        fd.append("model3d", file);
                        try {
                          showToast("Uploading 3D model…", "info");
                          const { data } = await axios.patch(
                            `${API}/products/${editProduct._id}/model3d`,
                            fd,
                            { headers: { "Content-Type": "multipart/form-data" } }
                          );
                          setForm(f => ({ ...f, model3d: data.model3d }));
                          setProducts(prev =>
                            prev.map(p => p._id === editProduct._id ? { ...p, model3d: data.model3d } : p)
                          );
                          showToast("3D model uploaded!");
                        } catch (err) {
                          showToast("Upload failed: " + err.message, "error");
                        }
                        e.target.value = "";
                      }}
                    />

                    {/* Remove model */}
                    {form.model3d && (
                      <button
                        onClick={async () => {
                          try {
                            await axios.delete(`${API}/products/${editProduct._id}/model3d`);
                            setForm(f => ({ ...f, model3d: "" }));
                            setProducts(prev =>
                              prev.map(p => p._id === editProduct._id ? { ...p, model3d: undefined } : p)
                            );
                            showToast("3D model removed.", "info");
                          } catch (err) {
                            showToast("Remove failed: " + err.message, "error");
                          }
                        }}
                        style={{
                          background: "#fce4ec", color: "#c62828", border: "none",
                          borderRadius: 8, padding: "8px 14px", cursor: "pointer",
                          fontSize: 13, fontWeight: 600,
                        }}
                      >
                        🗑 Remove 3D Model
                      </button>
                    )}

                    {/* Preview badge */}
                    {form.model3d && (
                      <span style={{
                        background: "#e8f5e9", color: "#2e7d32",
                        fontSize: 12, fontWeight: 600, padding: "6px 12px",
                        borderRadius: 20, display: "inline-flex", alignItems: "center", gap: 5,
                      }}>
                        🥽 AR Ready
                      </span>
                    )}
                  </div>
                )}

                {/* Hint for new product */}
                {!editProduct?._id && (
                  <div style={{ marginTop: 10, background: "#fff8e1", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#795548" }}>
                    💡 To upload a .glb file directly, <strong>save the product first</strong>, then re-open it to use the file uploader.
                  </div>
                )}
              </Section>

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
                <button onClick={() => setProductModal(false)} style={{ background: "#f5f2ef", color: "#555", border: "none", borderRadius: 10, padding: "10px 22px", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>Cancel</button>
                <button onClick={handleSaveProduct} disabled={saving} style={{ background: "#1a1a2e", color: "#f48fb1", border: "none", borderRadius: 10, padding: "10px 24px", cursor: "pointer", fontWeight: 700, fontSize: 14, opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Saving…" : editProduct ? "Save Changes" : "Add Product"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CATEGORY MODAL ───────────────────────────────────────────────────── */}
      {catModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
            <div style={{ padding: "22px 28px 16px", borderBottom: "1px solid #ede8e3", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#fff" }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1a1a2e" }}>{editCat ? "Edit Category" : "Add New Category"}</h2>
              <button onClick={() => setCatModal(false)} style={{ background: "#f5f2ef", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 18, color: "#555" }}>✕</button>
            </div>
            <div style={{ padding: "22px 28px 28px" }}>

              {/* Live Preview */}
              <div style={{ background: catForm.color, borderRadius: 14, padding: "18px 22px", display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
                <span style={{ fontSize: 38 }}>{catForm.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: "#1a1a2e" }}>{catForm.label || "Category Name"}</div>
                  <div style={{ fontSize: 12, color: "#666" }}>Live preview</div>
                </div>
              </div>

              <Field label="Category Name *">
                <input value={catForm.label} onChange={e => setCatForm(f => ({ ...f, label: e.target.value }))} placeholder="e.g. Teens & Pre-teens" style={{ ...inp, marginBottom: 14 }} />
              </Field>

              <Field label="Icon">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                  {EMOJI_OPTIONS.map(e => (
                    <button key={e} onClick={() => setCatForm(f => ({ ...f, icon: e }))} style={{ fontSize: 22, padding: 6, border: catForm.icon === e ? "2.5px solid #f48fb1" : "2px solid transparent", borderRadius: 8, background: catForm.icon === e ? "#fce4ec" : "#f5f2ef", cursor: "pointer" }}>{e}</button>
                  ))}
                </div>
              </Field>

              <Field label="Background Color">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                  {DEFAULT_CATEGORY_COLORS.map(col => (
                    <button key={col} onClick={() => setCatForm(f => ({ ...f, color: col }))} style={{ width: 32, height: 32, borderRadius: 8, background: col, border: catForm.color === col ? "3px solid #1a1a2e" : "2px solid transparent", cursor: "pointer" }} />
                  ))}
                  <input type="color" value={catForm.color} onChange={e => setCatForm(f => ({ ...f, color: e.target.value }))} style={{ width: 32, height: 32, borderRadius: 8, border: "2px solid #e0dbd5", padding: 2, cursor: "pointer", background: "none" }} title="Custom color" />
                </div>
              </Field>

              <Field label="Subcategories (comma-separated)">
                <input value={catForm.subcategories} onChange={e => setCatForm(f => ({ ...f, subcategories: e.target.value }))} placeholder="e.g. Action Figures, Board Games, Puzzles" style={{ ...inp, marginBottom: 14 }} />
              </Field>

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button onClick={() => setCatModal(false)} style={{ background: "#f5f2ef", color: "#555", border: "none", borderRadius: 10, padding: "10px 22px", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
                <button onClick={handleSaveCategory} style={{ background: "#1a1a2e", color: "#f48fb1", border: "none", borderRadius: 10, padding: "10px 24px", cursor: "pointer", fontWeight: 700 }}>
                  {editCat ? "Save Changes" : "Add Category"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE PRODUCT CONFIRM ───────────────────────────────────────────── */}
      {deleteConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 18, padding: "32px 36px", maxWidth: 400, width: "90%", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, color: "#1a1a2e" }}>Delete Product?</h3>
            <p style={{ color: "#666", fontSize: 14, margin: "0 0 24px" }}>"{deleteConfirm.name}" will be permanently removed.</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ background: "#f5f2ef", color: "#555", border: "none", borderRadius: 10, padding: "10px 22px", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ background: "#c62828", color: "#fff", border: "none", borderRadius: 10, padding: "10px 22px", cursor: "pointer", fontWeight: 700 }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CATEGORY CONFIRM ──────────────────────────────────────────── */}
      {deleteCatConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 18, padding: "32px 36px", maxWidth: 400, width: "90%", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗂</div>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, color: "#1a1a2e" }}>Delete Category?</h3>
            <p style={{ color: "#666", fontSize: 14, margin: "0 0 24px" }}>"{deleteCatConfirm.label}" will be removed. Products in this category won't be deleted.</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={() => setDeleteCatConfirm(null)} style={{ background: "#f5f2ef", color: "#555", border: "none", borderRadius: 10, padding: "10px 22px", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
              <button onClick={() => handleDeleteCat(deleteCatConfirm)} style={{ background: "#c62828", color: "#fff", border: "none", borderRadius: 10, padding: "10px 22px", cursor: "pointer", fontWeight: 700 }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
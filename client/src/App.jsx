import React from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import StoreLayout from './components/StoreLayout';
import RegisterPage from "./pages/RegisterPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import ShopPage from "./pages/ShopPage.jsx";
import ProductDetailPage from "./pages/ProductDetailPage.jsx";
import BabyPage from "./pages/BabyPage.jsx";
import MommyPage from "./pages/MommyPage.jsx";
import FatherPage from "./pages/FatherPage.jsx";
import FancyPage from "./pages/FancyPage.jsx";
import DecorPage from "./pages/DecorPage.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx";
import OrderSuccessPage from "./pages/OrderSuccessPage.jsx";
import OrdersPage from "./pages/OrdersPage.jsx";
import WishlistPage from "./pages/WishlistPage.jsx";
import DashboardPage from "./pages/admin/DashboardPage.jsx";
import AdminOrdersPage from "./pages/admin/OrdersPage.jsx";

// Wrapper for all public frontend pages
const FrontendWrapper = () => {
  return (
    <StoreLayout>
      <Outlet />
    </StoreLayout>
  );
};

function App() {
  return (
    <AuthProvider>
      <WishlistProvider>
        <CartProvider>
          <Toaster
            position="bottom-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: 'var(--card-bg, #fff)',
                color: 'var(--text, #333)',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
              }
            }}
          />
          <Routes>
            {/* Frontend Routes wrapped in StoreLayout */}
            <Route element={<FrontendWrapper />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/product/:id" element={<ProductDetailPage />} />
              <Route path="/baby" element={<BabyPage />} />
              <Route path="/mommy" element={<MommyPage />} />
              <Route path="/father" element={<FatherPage />} />
              <Route path="/decor" element={<DecorPage />} />
              <Route path="/fancy" element={<FancyPage />} />

              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/order-success" element={<OrderSuccessPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/wishlist" element={<WishlistPage />} />

              <Route path="/register" element={<RegisterPage />} />
              <Route path="/login" element={<LoginPage />} />
            </Route>

            {/* Admin Routes - standalone */}
            <Route path="/admin">
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="orders" element={<AdminOrdersPage />} />
            </Route>
          </Routes>
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  );
}

export default App;
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Heart, Users, CheckCircle, XCircle, AlertTriangle, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function InvitationPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, token: authToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [invitationData, setInvitationData] = useState(null);
  const [error, setError] = useState(null);
  const [acting, setActing] = useState(false);
  const [resolvedStatus, setResolvedStatus] = useState(null); // 'accepted' | 'rejected'

  useEffect(() => {
    fetchInvitation();
  }, [token]);

  const fetchInvitation = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`http://localhost:5000/api/invitations/verify/${token}`);
      if (res.data?.success) {
        setInvitationData(res.data.invitation);
      } else {
        setError(res.data?.message || 'Invalid or expired invitation link.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invitation link not found or expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!user) {
      // Store target return URL and redirect to login
      localStorage.setItem('redirectAfterAuth', `/wishlist/invitation/${token}`);
      toast.info('Please log in with the invited email to accept.');
      navigate('/login');
      return;
    }

    try {
      setActing(true);
      const res = await axios.post(
        `http://localhost:5000/api/invitations/${token}/accept`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      if (res.data?.success) {
        toast.success(res.data.message || 'Invitation accepted! Welcome to the collection.');
        setResolvedStatus('accepted');
        setTimeout(() => {
          navigate(`/wishlist/${res.data.wishlistId}`);
        }, 1500);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept invitation.');
    } finally {
      setActing(false);
    }
  };

  const handleReject = async () => {
    if (!user) {
      toast.info('Please log in to decline this invitation.');
      navigate('/login');
      return;
    }

    try {
      setActing(true);
      const res = await axios.post(
        `http://localhost:5000/api/invitations/${token}/reject`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      if (res.data?.success) {
        toast.info(res.data.message || 'Invitation declined.');
        setResolvedStatus('rejected');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to decline invitation.');
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-pink-50/40 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-pink-500 mx-auto mb-3" />
          <p className="text-gray-600 font-medium text-sm">Verifying gift collection invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-pink-50/40 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-pink-100 p-8 text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Invitation Unavailable</h2>
          <p className="text-gray-600 text-sm mb-6 leading-relaxed">{error}</p>
          <div className="space-y-3">
            <Link
              to="/wishlist"
              className="block w-full py-3 bg-gradient-to-r from-pink-500 to-rose-400 text-white font-semibold rounded-2xl shadow hover:opacity-95 transition"
            >
              Go to My Wishlists
            </Link>
            <Link
              to="/"
              className="block w-full py-2.5 text-gray-500 hover:text-gray-800 text-sm font-medium transition"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { wishlist, inviter, role, inviteEmail, expiresAt } = invitationData || {};

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/70 via-white to-pink-50/40 py-16 px-4 flex items-center justify-center">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl border border-pink-100/80 overflow-hidden relative">
        {/* Top Decorative Banner */}
        <div className="bg-gradient-to-r from-pink-500 via-rose-400 to-pink-400 p-8 text-white text-center relative">
          <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Shared Collection
          </div>
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Heart className="w-8 h-8 text-white fill-current" />
          </div>
          <h1 className="text-2xl font-bold">You're Invited!</h1>
          <p className="text-pink-100 text-sm mt-1">Collaborative Wishlist Invitation</p>
        </div>

        {/* Content Body */}
        <div className="p-8">
          {resolvedStatus === 'accepted' ? (
            <div className="text-center py-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3 animate-bounce" />
              <h3 className="text-xl font-bold text-gray-800">Welcome to the Collection!</h3>
              <p className="text-gray-600 text-sm mt-2">
                Redirecting to <span className="font-semibold text-pink-600">"{wishlist?.name}"</span>...
              </p>
            </div>
          ) : resolvedStatus === 'rejected' ? (
            <div className="text-center py-6">
              <XCircle className="w-16 h-16 text-gray-400 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-gray-800">Invitation Declined</h3>
              <p className="text-gray-600 text-sm mt-2">You declined to join this wishlist collection.</p>
              <Link
                to="/wishlist"
                className="mt-6 inline-block px-6 py-2.5 bg-pink-50 text-pink-600 rounded-xl font-medium text-sm hover:bg-pink-100 transition"
              >
                Back to My Collections
              </Link>
            </div>
          ) : (
            <>
              {/* Inviter & Target Wishlist Info */}
              <div className="bg-pink-50/50 rounded-2xl p-5 border border-pink-100/60 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-pink-100 flex-shrink-0">
                    {wishlist?.coverImage ? (
                      <img
                        src={wishlist.coverImage}
                        alt={wishlist.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-pink-400">
                        <Heart className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{wishlist?.name}</h3>
                    <p className="text-xs text-gray-500 line-clamp-1">{wishlist?.description || 'Curated Gift Wishlist'}</p>
                    <p className="text-xs text-pink-600 font-medium mt-1">
                      Invited by <span className="font-bold">{inviter?.name}</span> ({inviter?.email})
                    </p>
                  </div>
                </div>
              </div>

              {/* Invited Role & Details */}
              <div className="space-y-3 mb-6 text-sm text-gray-600">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-500">Collaborator Role</span>
                  <span className="capitalize font-semibold text-pink-600 px-2.5 py-0.5 bg-pink-100/60 rounded-full text-xs">
                    {role}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-500">Invited Recipient</span>
                  <span className="font-medium text-gray-700">{inviteEmail}</span>
                </div>
                {expiresAt && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl text-xs text-gray-500">
                    <span>Expires</span>
                    <span>{new Date(expiresAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {/* Authentication Match Check */}
              {user ? (
                user.email?.toLowerCase() !== inviteEmail?.toLowerCase() ? (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 mb-6 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      You are logged in as <span className="font-bold">{user.email}</span>. This invitation was sent to{' '}
                      <span className="font-bold">{inviteEmail}</span>. Please switch accounts to accept.
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700 mb-6 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>Logged in as verified recipient ({user.email})</span>
                  </div>
                )
              ) : (
                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 mb-6">
                  Please log in with <span className="font-bold">{inviteEmail}</span> to claim this invitation.
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleReject}
                  disabled={acting}
                  className="w-1/3 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-2xl text-sm transition"
                >
                  Decline
                </button>
                <button
                  onClick={handleAccept}
                  disabled={acting || (user && user.email?.toLowerCase() !== inviteEmail?.toLowerCase())}
                  className="w-2/3 py-3 px-4 bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white font-semibold rounded-2xl text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {acting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>{user ? 'Accept & Join' : 'Log In to Accept'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

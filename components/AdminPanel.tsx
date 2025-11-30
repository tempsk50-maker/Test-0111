
import React, { useState, useEffect } from 'react';
import { Check, X, Shield, UserX, UserCheck, Search, Loader2, Trash2, ShieldAlert } from 'lucide-react';
import { db } from '../services/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { UserProfile, UserRole, UserStatus } from '../types';

const AdminPanel = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const userList = snapshot.docs.map(doc => doc.data() as UserProfile);
      setUsers(userList);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateUserStatus = async (uid: string, newStatus: UserStatus) => {
    setActionLoading(uid);
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { status: newStatus });
      
      // Update local state
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, status: newStatus } : u));
    } catch (error) {
      console.error("Error updating status:", error);
      alert("স্ট্যাটাস আপডেট করা যায়নি।");
    } finally {
      setActionLoading(null);
    }
  };

  const updateUserRole = async (uid: string, newRole: UserRole) => {
     if (!window.confirm("আপনি কি নিশ্চিত এই ইউজারের রোল পরিবর্তন করতে চান?")) return;
     setActionLoading(uid);
     try {
       const userRef = doc(db, 'users', uid);
       await updateDoc(userRef, { role: newRole });
       setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole } : u));
     } catch (error) {
       console.error("Error updating role:", error);
     } finally {
       setActionLoading(null);
     }
  };

  const deleteUser = async (uid: string) => {
     if (!window.confirm("সতর্কতা: এই ইউজারকে ডিলিট করলে তার সব ডাটা মুছে যাবে। আপনি কি নিশ্চিত?")) return;
     setActionLoading(uid);
     try {
       await deleteDoc(doc(db, 'users', uid));
       setUsers(prev => prev.filter(u => u.uid !== uid));
     } catch (error) {
       console.error("Error deleting user:", error);
     } finally {
       setActionLoading(null);
     }
  };

  const filteredUsers = users.filter(u => 
    (u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     u.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const pendingCount = users.filter(u => u.status === 'pending').length;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
       {/* Header */}
       <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
               <Shield className="w-8 h-8 text-bk-green" />
               এডমিন প্যানেল
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
               মোট ইউজার: {users.length} | পেন্ডিং রিকোয়েস্ট: <span className="text-yellow-600 font-bold">{pendingCount}</span>
            </p>
          </div>
          
          <div className="relative w-full md:w-auto">
             <input 
               type="text" 
               placeholder="নাম বা ইমেইল খুঁজুন..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full md:w-80 pl-10 pr-4 py-2.5 bg-white dark:bg-bk-input-dark border border-gray-200 dark:border-bk-border-dark rounded-xl focus:ring-2 focus:ring-bk-green/20 outline-none"
             />
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
       </div>

       {/* Users Table */}
       <div className="bg-white dark:bg-bk-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-bk-border-dark overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
               <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold">
                  <tr>
                     <th className="px-6 py-4">ইউজার</th>
                     <th className="px-6 py-4">রোল (Role)</th>
                     <th className="px-6 py-4">স্ট্যাটাস</th>
                     <th className="px-6 py-4">জয়েনিং তারিখ</th>
                     <th className="px-6 py-4 text-right">অ্যাকশন</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100 dark:divide-bk-border-dark">
                  {loading ? (
                     <tr>
                        <td colSpan={5} className="py-20 text-center text-gray-500">
                           <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                           লোড হচ্ছে...
                        </td>
                     </tr>
                  ) : filteredUsers.length === 0 ? (
                     <tr>
                        <td colSpan={5} className="py-20 text-center text-gray-500">
                           কোনো ইউজার পাওয়া যায়নি
                        </td>
                     </tr>
                  ) : (
                     filteredUsers.map((user) => (
                        <tr key={user.uid} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                 {user.photoURL ? (
                                    <img src={user.photoURL} className="w-10 h-10 rounded-full border border-gray-200" alt="" />
                                 ) : (
                                    <div className="w-10 h-10 rounded-full bg-bk-green/10 text-bk-green flex items-center justify-center font-bold">
                                       {user.displayName?.charAt(0) || '?'}
                                    </div>
                                 )}
                                 <div>
                                    <div className="font-bold text-gray-800 dark:text-white">{user.displayName || 'Unknown'}</div>
                                    <div className="text-xs text-gray-500">{user.email || user.phone}</div>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <select 
                                 value={user.role}
                                 onChange={(e) => updateUserRole(user.uid, e.target.value as UserRole)}
                                 className="bg-transparent border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1 text-xs font-bold text-gray-700 dark:text-gray-300 focus:border-bk-green outline-none"
                              >
                                 <option value="user">User</option>
                                 <option value="editor">Editor</option>
                                 <option value="admin">Admin</option>
                              </select>
                           </td>
                           <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold 
                                 ${user.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                                   user.status === 'blocked' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                                   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                                 {user.status === 'approved' && <Check className="w-3 h-3" />}
                                 {user.status === 'blocked' && <UserX className="w-3 h-3" />}
                                 {user.status === 'pending' && <Loader2 className="w-3 h-3" />}
                                 {user.status.toUpperCase()}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-gray-500 text-xs">
                              {new Date(user.createdAt).toLocaleDateString('bn-BD')}
                              <br/>
                              {new Date(user.createdAt).toLocaleTimeString('bn-BD')}
                           </td>
                           <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                 {actionLoading === user.uid ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-bk-green" />
                                 ) : (
                                    <>
                                       {user.status === 'pending' && (
                                          <button 
                                             onClick={() => updateUserStatus(user.uid, 'approved')}
                                             className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
                                             title="Approve"
                                          >
                                             <Check className="w-4 h-4" />
                                          </button>
                                       )}
                                       
                                       {user.status !== 'blocked' ? (
                                          <button 
                                             onClick={() => updateUserStatus(user.uid, 'blocked')}
                                             className="p-2 bg-gray-100 text-gray-500 rounded-lg hover:bg-red-100 hover:text-red-500 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                                             title="Block User"
                                          >
                                             <UserX className="w-4 h-4" />
                                          </button>
                                       ) : (
                                          <button 
                                             onClick={() => updateUserStatus(user.uid, 'approved')}
                                             className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-green-100 hover:text-green-500"
                                             title="Unblock"
                                          >
                                             <UserCheck className="w-4 h-4" />
                                          </button>
                                       )}

                                       <button 
                                          onClick={() => deleteUser(user.uid)}
                                          className="p-2 bg-gray-100 text-gray-400 rounded-lg hover:bg-red-100 hover:text-red-600 dark:bg-white/5 dark:hover:bg-red-900/30 transition-colors"
                                          title="Delete Permanently"
                                       >
                                          <Trash2 className="w-4 h-4" />
                                       </button>
                                    </>
                                 )}
                              </div>
                           </td>
                        </tr>
                     ))
                  )}
               </tbody>
            </table>
          </div>
       </div>
    </div>
  );
};

export default AdminPanel;

import React, { useState, useEffect, useRef } from 'react';
import api from './api';
import { getSocket, disconnectSocket } from './socket';
import AuthModal from './components/AuthModal';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import SecurityDashboard from './components/SecurityDashboard';
import NewChatModal from './components/NewChatModal';
import VerificationDetailModal from './components/VerificationDetailModal';
import UserProfileModal from './components/UserProfileModal';
import ChatProfileModal from './components/ChatProfileModal';
import ChatBackupModal from './components/ChatBackupModal';
import StorageManagerModal from './components/StorageManagerModal';
import StarredMessagesModal from './components/StarredMessagesModal';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('qchat_user');
      const token = localStorage.getItem('qchat_token');
      if (!saved || !token) return null;
      const parsed = JSON.parse(saved);
      return parsed && (parsed.id || parsed._id || parsed.email) ? parsed : null;
    } catch {
      localStorage.removeItem('qchat_user');
      localStorage.removeItem('qchat_token');
      return null;
    }
  });

  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingStatus, setTypingStatus] = useState(null);
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [activeToast, setActiveToast] = useState(null);

  // Modals state
  const [showSecurityDashboard, setShowSecurityDashboard] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [selectedMessageForVer, setSelectedMessageForVer] = useState(null);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [showChatProfileModal, setShowChatProfileModal] = useState(false);
  const [showChatBackupModal, setShowChatBackupModal] = useState(false);
  const [chatForBackup, setChatForBackup] = useState(null);
  const [showStorageManagerModal, setShowStorageManagerModal] = useState(false);
  const [showStarredMessagesModal, setShowStarredMessagesModal] = useState(false);

  // Fetch chats on mount / auth change
  const fetchChats = async () => {
    try {
      const res = await api.get('/chats');
      setChats(res.data.chats || []);
      // If no active chat, select first if available
      if (res.data.chats && res.data.chats.length > 0 && !activeChat) {
        setActiveChat(res.data.chats[0]);
      }
    } catch (err) {
      console.error('Error fetching chats:', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchChats();
    }
  }, [currentUser]);

  // Fetch messages when activeChat changes
  useEffect(() => {
    if (!activeChat) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        const res = await api.get(`/chats/${activeChat._id}/messages`);
        setMessages(res.data.messages || []);
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
    };

    fetchMessages();

    // Mark as read
    api.put(`/chats/${activeChat._id}/read`).catch(() => {});
  }, [activeChat]);

  // Socket.io Real-time setup
  useEffect(() => {
    if (!currentUser) return;

    const socket = getSocket();
    if (!socket) return;

    // Join active chat room
    if (activeChat) {
      socket.emit('chat:join', { chatId: activeChat._id });
    }

    // New message handler
    const handleNewMessage = (newMsg) => {
      if (activeChat && newMsg.chatId === activeChat._id) {
        setMessages((prev) => [...prev, newMsg]);
      }

      // Update chats list lastMessage
      setChats((prevChats) =>
        prevChats.map((c) =>
          c._id === newMsg.chatId
            ? { ...c, lastMessage: newMsg, updatedAt: new Date() }
            : c
        )
      );
    };

    // Message status handler
    const handleMessageStatus = (data) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === data.messageId
            ? { ...m, deliveryState: data.deliveryState }
            : m
        )
      );
    };

    // Presence update handler
    const handlePresenceUpdate = (data) => {
      setChats((prevChats) =>
        prevChats.map((c) => ({
          ...c,
          participants: c.participants.map((p) =>
            p._id === data.userId ? { ...p, isOnline: data.isOnline } : p
          )
        }))
      );
    };

    // Typing status handler
    const handleTypingStatus = (data) => {
      setTypingStatus(data);
    };

    // Security alert handler
    const handleSecurityAlert = (alert) => {
      setSecurityAlerts((prev) => [alert, ...prev]);
      setActiveToast(alert);
      setTimeout(() => {
        setActiveToast(null);
      }, 6000);
    };

    // Channel update handler
    const handleChannelUpdate = (data) => {
      setChats((prev) =>
        prev.map((c) =>
          c._id === data.chatId ? { ...c, e91Status: data.e91Status } : c
        )
      );
      if (activeChat && activeChat._id === data.chatId) {
        setActiveChat((prev) => ({ ...prev, e91Status: data.e91Status }));
      }
    };

    // Chat cleared handler
    const handleChatCleared = (data) => {
      const myId = String(currentUser?.id || currentUser?._id || '');
      if (String(data.userId) === myId) {
        if (activeChat && activeChat._id === data.chatId) {
          setMessages([]);
          setActiveChat((prev) => (prev ? { ...prev, lastMessage: null } : prev));
        }
        setChats((prev) =>
          prev.map((c) => (c._id === data.chatId ? { ...c, lastMessage: null } : c))
        );
      }
    };

    // User profile update handler
    const handleUserUpdated = (updatedUser) => {
      const updatedId = String(updatedUser?.id || updatedUser?._id || '');
      const currentId = String(currentUser?.id || currentUser?._id || '');

      if (updatedId === currentId) {
        handleUpdateCurrentUser(updatedUser);
      }
      setChats((prev) =>
        prev.map((c) => ({
          ...c,
          participants: c.participants?.map((p) =>
            String(p?._id || p?.id || p) === updatedId ? { ...p, ...updatedUser } : p
          )
        }))
      );
      setActiveChat((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          participants: prev.participants?.map((p) =>
            String(p?._id || p?.id || p) === updatedId ? { ...p, ...updatedUser } : p
          )
        };
      });
    };

    // Message reaction handler
    const handleMessageReaction = (data) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === data.messageId ? { ...m, reactions: data.reactions } : m
        )
      );
    };

    // Message edited handler
    const handleMessageEdited = (data) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === data.messageId
            ? {
                ...m,
                plaintextPreview: data.plaintextPreview,
                isEdited: true,
                editedAt: data.editedAt
              }
            : m
        )
      );
    };

    // Message deleted handler
    const handleMessageDeleted = (data) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === data.messageId
            ? {
                ...m,
                isDeletedForEveryone: true,
                plaintextPreview: 'This message was deleted'
              }
            : m
        )
      );
      setChats((prevChats) =>
        prevChats.map((c) =>
          (c.lastMessage?._id || c.lastMessage) === data.messageId
            ? {
                ...c,
                lastMessage: {
                  ...c.lastMessage,
                  isDeletedForEveryone: true,
                  plaintextPreview: 'This message was deleted'
                }
              }
            : c
        )
      );
      setActiveChat((prevChat) =>
        prevChat && (prevChat.lastMessage?._id || prevChat.lastMessage) === data.messageId
          ? {
              ...prevChat,
              lastMessage: {
                ...prevChat.lastMessage,
                isDeletedForEveryone: true,
                plaintextPreview: 'This message was deleted'
              }
            }
          : prevChat
      );
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:status', handleMessageStatus);
    socket.on('message:reaction', handleMessageReaction);
    socket.on('message:edited', handleMessageEdited);
    socket.on('message:deleted', handleMessageDeleted);
    socket.on('presence:update', handlePresenceUpdate);
    socket.on('typing:status', handleTypingStatus);
    socket.on('security:alert', handleSecurityAlert);
    socket.on('channel:update', handleChannelUpdate);
    socket.on('chat:cleared', handleChatCleared);
    socket.on('user:updated', handleUserUpdated);

    return () => {
      if (activeChat) {
        socket.emit('chat:leave', { chatId: activeChat._id });
      }
      socket.off('message:new', handleNewMessage);
      socket.off('message:status', handleMessageStatus);
      socket.off('message:reaction', handleMessageReaction);
      socket.off('message:edited', handleMessageEdited);
      socket.off('message:deleted', handleMessageDeleted);
      socket.off('presence:update', handlePresenceUpdate);
      socket.off('typing:status', handleTypingStatus);
      socket.off('security:alert', handleSecurityAlert);
      socket.off('channel:update', handleChannelUpdate);
      socket.off('chat:cleared', handleChatCleared);
      socket.off('user:updated', handleUserUpdated);
    };
  }, [currentUser, activeChat]);

  const handleToggleBlockContact = async (targetUser) => {
    if (!targetUser) return;
    const targetId = targetUser._id || targetUser.id;
    const isBlocked = currentUser?.blockedUsers?.some(
      (id) => (id._id || id).toString() === targetId.toString()
    );

    try {
      const endpoint = isBlocked ? '/auth/unblock' : '/auth/block';
      const res = await api.post(endpoint, { targetUserId: targetId });
      handleUpdateCurrentUser({ blockedUsers: res.data.blockedUsers });
    } catch (err) {
      alert('Failed to update block state: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleUpdateCurrentUser = (updatedFields) => {
    setCurrentUser((prev) => {
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem('qchat_user', JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearMessages = (chatId) => {
    if (activeChat?._id === chatId) {
      setMessages([]);
      setActiveChat((prev) => (prev ? { ...prev, lastMessage: null } : prev));
    }
    setChats((prev) =>
      prev.map((c) => (c._id === chatId ? { ...c, lastMessage: null } : c))
    );
  };

  const handleDeleteMessage = (messageId, deleteForEveryone) => {
    if (deleteForEveryone) {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId
            ? { ...m, isDeletedForEveryone: true, plaintextPreview: 'This message was deleted' }
            : m
        )
      );
      setChats((prev) =>
        prev.map((c) =>
          (c.lastMessage?._id || c.lastMessage) === messageId
            ? {
                ...c,
                lastMessage: {
                  ...c.lastMessage,
                  isDeletedForEveryone: true,
                  plaintextPreview: 'This message was deleted'
                }
              }
            : c
        )
      );
      setActiveChat((prev) =>
        prev && (prev.lastMessage?._id || prev.lastMessage) === messageId
          ? {
              ...prev,
              lastMessage: {
                ...prev.lastMessage,
                isDeletedForEveryone: true,
                plaintextPreview: 'This message was deleted'
              }
            }
          : prev
      );
    } else {
      setMessages((prev) => {
        const remaining = prev.filter((m) => m._id !== messageId);
        const newLast = remaining.length > 0 ? remaining[remaining.length - 1] : null;
        setChats((prevChats) =>
          prevChats.map((c) =>
            c._id === activeChat?._id && (c.lastMessage?._id || c.lastMessage) === messageId
              ? { ...c, lastMessage: newLast }
              : c
          )
        );
        setActiveChat((prevChat) =>
          prevChat && (prevChat.lastMessage?._id || prevChat.lastMessage) === messageId
            ? { ...prevChat, lastMessage: newLast }
            : prevChat
        );
        return remaining;
      });
    }
  };

  // Send message action
  const handleSendMessage = async (payload) => {
    if (!activeChat) return;

    try {
      await api.post('/messages', {
        chatId: activeChat._id,
        ...payload
      });
    } catch (err) {
      alert('Failed to send quantum message: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('qchat_token');
    localStorage.removeItem('qchat_user');
    disconnectSocket();
    setCurrentUser(null);
    setChats([]);
    setActiveChat(null);
    setMessages([]);
  };

  if (!currentUser) {
    return <AuthModal onAuthSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="fixed inset-0 w-full h-full flex bg-wa-bg overflow-hidden select-none">
      {/* Real-Time Security Alert Toast */}
      {activeToast && (
        <div className="fixed top-4 right-4 z-50 max-w-md p-4 bg-red-950/90 border-2 border-red-500 rounded-xl shadow-2xl animate-in slide-in-from-top-4 flex items-start gap-3">
          <div className="p-2 rounded-full bg-red-500/20 text-red-400 shrink-0">
            <ShieldAlert className="w-6 h-6 text-red-400" />
          </div>
          <div className="flex-1 text-xs text-red-100">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold uppercase tracking-wider text-red-300">
                ⚠️ Quantum Alert: {activeToast.attackType}
              </span>
              <button
                onClick={() => setActiveToast(null)}
                className="text-red-400 hover:text-white"
              >
                &times;
              </button>
            </div>
            <p className="leading-snug">{activeToast.reason}</p>
            <button
              onClick={() => {
                setShowSecurityDashboard(true);
                setActiveToast(null);
              }}
              className="mt-2 text-[11px] text-quantum-cyan hover:underline font-bold"
            >
              Open Threat Inspector &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Main WhatsApp Web Shell: Sidebar Container */}
      <div className={`${activeChat ? 'hidden md:flex' : 'flex'} w-full md:w-[380px] lg:w-[420px] h-full shrink-0 flex-col min-h-0 overflow-hidden`}>
        <Sidebar
          currentUser={currentUser}
          chats={chats}
          activeChat={activeChat}
          onSelectChat={(chat) => setActiveChat(chat)}
          onOpenNewChatModal={() => setShowNewChatModal(true)}
          onOpenSecurityDashboard={() => setShowSecurityDashboard(true)}
          onOpenUserProfile={() => setShowUserProfileModal(true)}
          onOpenStorageManager={() => setShowStorageManagerModal(true)}
          onOpenStarredMessages={() => setShowStarredMessagesModal(true)}
          onChatsUpdated={fetchChats}
          onLogout={handleLogout}
        />
      </div>

      {/* Main WhatsApp Web Shell: Active Chat Window or Desktop Splash */}
      {activeChat ? (
        <div className="flex-1 h-full w-full flex flex-col min-w-0 min-h-0 overflow-hidden">
          <ChatWindow
            activeChat={activeChat}
            currentUser={currentUser}
            messages={messages}
            typingStatus={typingStatus}
            chats={chats}
            onSelectChat={(chat) => setActiveChat(chat)}
            onOpenNewChat={() => setShowNewChatModal(true)}
            onSendMessage={handleSendMessage}
            onOpenSecurityDashboard={() => setShowSecurityDashboard(true)}
            onSelectMessageVerification={(msg) => setSelectedMessageForVer(msg)}
            onUpdateCurrentUser={handleUpdateCurrentUser}
            onClearChat={handleClearMessages}
            onDeleteMessage={handleDeleteMessage}
            onOpenChatProfile={() => setShowChatProfileModal(true)}
            onOpenUserProfile={() => setShowUserProfileModal(true)}
            onOpenStorageManager={() => setShowStorageManagerModal(true)}
            onOpenStarredMessages={() => setShowStarredMessagesModal(true)}
            onOpenBackup={(chat) => {
              setChatForBackup(chat || activeChat);
              setShowChatBackupModal(true);
            }}
            onBack={() => setActiveChat(null)}
          />
        </div>
      ) : (
        <div className="hidden md:flex flex-1 h-full bg-wa-surface flex-col items-center justify-center p-8 text-center select-none border-b-[6px] border-wa-green">
          <div className="w-24 h-24 rounded-full bg-wa-panel border border-wa-border flex items-center justify-center text-quantum-cyan mb-4 shadow-xl">
            <AlertTriangle className="w-12 h-12 text-wa-green" />
          </div>
          <h2 className="text-2xl font-bold text-wa-textPrimary mb-2">QChat Web for Desktop</h2>
          <p className="text-xs text-wa-textSecondary max-w-sm leading-relaxed mb-6">
            Send and receive quantum-signed messages without keeping your phone online. Secured with Simulated Teleportation QDS and Dynamic E91 Bell Entanglement.
          </p>
          <button
            onClick={() => setShowNewChatModal(true)}
            className="px-4 py-2 bg-wa-green hover:bg-wa-greenHover text-white font-semibold rounded-lg text-xs shadow-md transition"
          >
            Start a Quantum Chat
          </button>
        </div>
      )}

      {/* Security & Threat Dashboard Side Drawer */}
      {showSecurityDashboard && (
        <SecurityDashboard
          chatId={activeChat?._id || chats[0]?._id}
          onClose={() => setShowSecurityDashboard(false)}
          securityAlerts={securityAlerts}
          latestMessage={messages.length > 0 ? messages[messages.length - 1] : null}
        />
      )}

      {/* New Chat Modal */}
      {showNewChatModal && (
        <NewChatModal
          currentUser={currentUser}
          onClose={() => setShowNewChatModal(false)}
          onChatCreated={(newChat) => {
            setChats((prev) => [newChat, ...prev.filter((c) => c._id !== newChat._id)]);
            setActiveChat(newChat);
          }}
        />
      )}

      {/* Deep Dive QDS Verification Detail Modal */}
      {selectedMessageForVer && (
        <VerificationDetailModal
          message={selectedMessageForVer}
          onClose={() => setSelectedMessageForVer(null)}
        />
      )}

      {/* User Profile Settings Modal */}
      {showUserProfileModal && (
        <UserProfileModal
          currentUser={currentUser}
          onClose={() => setShowUserProfileModal(false)}
          onUpdateUser={(updated) => handleUpdateCurrentUser(updated)}
        />
      )}

      {/* Chat / Contact Profile Modal */}
      {showChatProfileModal && activeChat && (
        <ChatProfileModal
          activeChat={activeChat}
          currentUser={currentUser}
          messages={messages}
          onClose={() => setShowChatProfileModal(false)}
          onOpenBackup={(chat) => {
            setChatForBackup(chat || activeChat);
            setShowChatBackupModal(true);
          }}
          onClearChat={handleClearMessages}
          onToggleBlock={() => {
            const other = activeChat?.isGroup
              ? null
              : activeChat?.participants?.find((p) => (p._id || p.id) !== currentUser.id);
            if (other) handleToggleBlockContact(other);
          }}
          isContactBlocked={Boolean(
            !activeChat?.isGroup &&
            activeChat?.participants?.find((p) => (p._id || p.id) !== currentUser.id) &&
            currentUser?.blockedUsers?.some(
              (id) => (id._id || id).toString() === (activeChat.participants.find((p) => (p._id || p.id) !== currentUser.id)?._id || '').toString()
            )
          )}
        />
      )}

      {/* Chat Cryptographic Backup & Transcript Modal */}
      {showChatBackupModal && (chatForBackup || activeChat) && (
        <ChatBackupModal
          activeChat={chatForBackup || activeChat}
          onClose={() => {
            setShowChatBackupModal(false);
            setChatForBackup(null);
          }}
          onRestoreSuccess={(chatId) => {
            fetchChats();
            if (activeChat?._id === chatId) {
              api.get(`/chats/${chatId}/messages`).then((r) => setMessages(r.data.messages || []));
            }
          }}
        />
      )}

      {/* Storage Manager Modal */}
      {showStorageManagerModal && (
        <StorageManagerModal
          onClose={() => setShowStorageManagerModal(false)}
          onStorageCleared={(chatId) => {
            if (activeChat?._id === chatId) {
              api.get(`/chats/${chatId}/messages`).then((r) => setMessages(r.data.messages || []));
            }
          }}
        />
      )}

      {/* Starred Messages Modal */}
      {showStarredMessagesModal && (
        <StarredMessagesModal
          onClose={() => setShowStarredMessagesModal(false)}
          onSelectChat={(chat) => {
            if (chat) {
              setActiveChat(chat);
            }
          }}
        />
      )}
    </div>
  );
}

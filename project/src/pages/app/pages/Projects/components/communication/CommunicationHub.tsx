import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { db } from '@/config/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, Timestamp, updateDoc, doc } from 'firebase/firestore';
import { FiMessageCircle, FiStar, FiAlertCircle, FiCheckCircle, FiClock, FiTag, FiUsers, FiLink, FiCornerDownRight, FiPlus, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Thread {
  id: string;
  title: string;
  lastMessageAt: string;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    avatar?: string;
  };
  type: 'update' | 'question' | 'decision' | 'idea';
  status: 'open' | 'resolved';
  priority: 'high' | 'medium' | 'low';
  messageCount: number;
}

interface Message {
  id: string;
  content: string;
  threadId: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  projectId: string;
  createdAt: string;
  reactions?: {
    emoji: string;
    users: string[];
  }[];
  isReply?: boolean;
}

const MESSAGE_TYPE_CONFIG = {
  update: { icon: FiMessageCircle, color: 'text-blue-500', bgColor: 'bg-blue-50', label: 'Update' },
  question: { icon: FiAlertCircle, color: 'text-yellow-500', bgColor: 'bg-yellow-50', label: 'Question' },
  decision: { icon: FiCheckCircle, color: 'text-green-500', bgColor: 'bg-green-50', label: 'Decision' },
  idea: { icon: FiStar, color: 'text-purple-500', bgColor: 'bg-purple-50', label: 'Idea' }
};

const PRIORITY_CONFIG = {
  high: { label: 'High Priority', color: 'text-red-500', bgColor: 'bg-red-50' },
  medium: { label: 'Medium Priority', color: 'text-orange-500', bgColor: 'bg-orange-50' },
  low: { label: 'Low Priority', color: 'text-gray-500', bgColor: 'bg-gray-50' }
};

export function CommunicationHub({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!projectId || !user) return;

    const threadsQuery = query(
      collection(db, 'threads'),
      where('projectId', '==', projectId),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribeThreads = onSnapshot(threadsQuery, (snapshot) => {
      const newThreads = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Thread[];
      setThreads(newThreads);
    }, (error) => {
      console.error('Error fetching threads:', error);
      toast.error('Failed to load threads');
    });

    let unsubscribeMessages = () => {};
    if (activeThread) {
      const messagesQuery = query(
        collection(db, 'messages'),
        where('threadId', '==', activeThread),
        orderBy('createdAt', 'asc')
      );

      unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
        const newMessages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Message[];
        setMessages(newMessages);
      }, (error) => {
        console.error('Error fetching messages:', error);
        toast.error('Failed to load messages');
      });
    }

    return () => {
      unsubscribeThreads();
      unsubscribeMessages();
    };
  }, [projectId, user, activeThread]);

  return (
    <div className="flex h-full">
      {/* Thread List */}
      <div className="w-1/3 border-r border-gray-200 p-4 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Threads</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCreatingThread(true)}
            className="flex items-center gap-2"
          >
            <FiPlus className="w-4 h-4" />
            New Thread
          </Button>
        </div>

        <div className="space-y-3">
          {threads.map(thread => {
            const TypeIcon = MESSAGE_TYPE_CONFIG[thread.type].icon;
            return (
              <Card
                key={thread.id}
                onClick={() => setActiveThread(thread.id)}
                className={`p-3 cursor-pointer transition-all hover:shadow-md ${
                  activeThread === thread.id ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${MESSAGE_TYPE_CONFIG[thread.type].bgColor}`}>
                    <TypeIcon className={`w-4 h-4 ${MESSAGE_TYPE_CONFIG[thread.type].color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{thread.title}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span>{format(new Date(thread.lastMessageAt), 'MMM d, h:mm a')}</span>
                      <span>•</span>
                      <span>{thread.messageCount} messages</span>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs ${PRIORITY_CONFIG[thread.priority].bgColor} ${PRIORITY_CONFIG[thread.priority].color}`}>
                    {thread.priority}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col h-full">
        {activeThread ? (
          <>
            {/* Thread Header */}
            <div className="p-4 border-b border-gray-200">
              {threads.find(t => t.id === activeThread)?.title}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 ${
                    message.sender.id === user?.uid ? 'flex-row-reverse' : ''
                  }`}
                >
                  <Avatar 
                    src={message.sender.avatar} 
                    fallback={message.sender.name[0]}
                  />
                  <div className={`flex flex-col ${
                    message.sender.id === user?.uid ? 'items-end' : 'items-start'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span>{format(new Date(message.createdAt), 'MMM d, h:mm a')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
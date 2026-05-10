import { X } from "lucide-react";
import Avatar from "../common/Avatar";

interface User {
  id: string;
  fullName: string;
  avatarUrl?: string;
}

interface InteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  users: User[];
  loading?: boolean;
}

export default function InteractionModal({ isOpen, onClose, title, users, loading }: InteractionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="max-h-[400px] overflow-y-auto p-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No one yet.</div>
          ) : (
            <div className="flex flex-col">
              {users.map((u) => (
                <div 
                  key={u.id} 
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group"
                >
                  <Avatar avatarUrl={u.avatarUrl} name={u.fullName} size={40} />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {u.fullName}
                    </div>
                  </div>
                  <button className="px-4 py-1.5 bg-gray-100 hover:bg-blue-600 hover:text-white text-gray-900 text-sm font-semibold rounded-lg transition-all">
                    Add Friend
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

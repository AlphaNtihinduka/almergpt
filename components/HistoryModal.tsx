import { FC, useEffect, useRef } from "react";

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const HistoryModal: FC<HistoryModalProps> = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4 transition-opacity duration-300">
      <div
        ref={modalRef}
        className="bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-700"
      >
        <header className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-gray-100">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </header>
        <div className="overflow-y-auto flex-grow">
          {children}
        </div>
      </div>
    </div>
  );
};
import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";

interface GlobalSearchDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function GlobalSearchDropdown({ isOpen, onClose, searchTerm, onSearchChange }: GlobalSearchDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Chiudi dropdown quando clicchi fuori
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div ref={dropdownRef} className="relative">
      {/* Dropdown Content */}
      <div className="absolute top-0 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto min-w-full">
        <div className="p-4">
          <div className="text-center py-6 text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p>Campo di ricerca attivo</p>
            <p className="text-sm mt-1">Usa la ricerca per navigare alle sezioni</p>
          </div>
        </div>
      </div>
    </div>
  );
}
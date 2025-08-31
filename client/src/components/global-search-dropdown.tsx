import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

interface GlobalSearchDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function GlobalSearchDropdown({ isOpen, onClose, searchTerm, onSearchChange }: GlobalSearchDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();

  // Gestisci la ricerca con tasto Invio
  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    
    const term = searchTerm.toLowerCase();
    
    // Determina dove navigare in base al termine di ricerca
    if (term.includes('pc') || term.includes('computer') || term.includes('inventario')) {
      setLocation("/inventory");
    } else if (term.includes('dipendent') || term.includes('utent') || term.includes('persone')) {
      setLocation("/employees");
    } else if (term.includes('manutenzione') || term.includes('riparazione') || term.includes('ric-')) {
      setLocation("/maintenance");
    } else if (term.includes('dashboard') || term.includes('home')) {
      setLocation("/");
    } else {
      // Default: vai all'inventario per ricerche generiche
      setLocation("/inventory");
    }
    
    onClose();
  };

  // Gestisci tasto Invio
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && isOpen) {
        handleSearch();
      } else if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, searchTerm, onClose]);

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
            <p>Ricerca Globale</p>
            <p className="text-sm mt-1">Digita e premi <kbd className="px-2 py-1 text-xs bg-gray-100 rounded">Invio</kbd> per navigare</p>
            <div className="text-xs mt-3 space-y-1">
              <p><strong>PC/Computer/Inventario</strong> → Inventario</p>
              <p><strong>Dipendenti/Utenti</strong> → Dipendenti</p>
              <p><strong>Manutenzione/RIC-</strong> → Manutenzione</p>
              <p><strong>Dashboard/Home</strong> → Dashboard</p>
            </div>
            {searchTerm.trim() && (
              <div className="mt-4">
                <Button 
                  onClick={handleSearch}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Cerca "{searchTerm}"
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
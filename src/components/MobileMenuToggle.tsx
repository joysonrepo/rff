'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './AppShell.module.css';

type MobileMenuToggleProps = {
  onClose: () => void;
  isOpen: boolean;
};

export function MobileMenuToggle({ onClose, isOpen }: MobileMenuToggleProps) {
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A') {
        onClose();
      }
    };

    const sidebar = sidebarRef.current;
    if (sidebar) {
      sidebar.addEventListener('click', handleLinkClick);
      return () => sidebar.removeEventListener('click', handleLinkClick);
    }
  }, [onClose]);

  return {
    sidebarRef,
    isOpen,
  };
}

export function MenuToggleButton({ isOpen, onClick }: { isOpen: boolean; onClick: () => void }) {
  return (
    <button
      className={styles.hamburger}
      onClick={onClick}
      aria-label="Toggle menu"
      aria-expanded={isOpen}
    >
      <span></span>
      <span></span>
      <span></span>
    </button>
  );
}

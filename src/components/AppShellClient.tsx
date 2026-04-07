'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import styles from './AppShell.module.css';
import { MenuToggleButton } from './MobileMenuToggle';

type AppShellClientProps = {
  sidebarContent: ReactNode;
  children: ReactNode;
};

export function AppShellClient({ sidebarContent, children }: AppShellClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A') {
        setIsOpen(false);
      }
    };

    const sidebar = sidebarRef.current;
    if (sidebar) {
      sidebar.addEventListener('click', handleLinkClick);
      return () => sidebar.removeEventListener('click', handleLinkClick);
    }
  }, []);

  return (
    <div className={styles.shell}>
      <MenuToggleButton isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />
      {isOpen && <div className={styles.overlay} onClick={() => setIsOpen(false)} />}

      <aside
        ref={sidebarRef}
        className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}
      >
        {sidebarContent}
      </aside>

      {children}
    </div>
  );
}

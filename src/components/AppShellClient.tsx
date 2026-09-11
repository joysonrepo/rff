'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import styles from './AppShell.module.css';
import { MenuToggleButton } from './MobileMenuToggle';
import { FlashToast } from './FlashToast';

type FlashProp = { type: 'success' | 'error'; message: string } | null | undefined;

type AppShellClientProps = {
  sidebarContent: ReactNode;
  children: ReactNode;
  flash?: FlashProp;
};

export function AppShellClient({ sidebarContent, children, flash }: AppShellClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPath, setLoadingPath] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const canShowLoadingRef = useRef(false);

  const canShowLoading = pathname !== '/attendance' && !pathname.startsWith('/attendance/');

  useEffect(() => {
    pathnameRef.current = pathname;
    canShowLoadingRef.current = canShowLoading;
  }, [canShowLoading, pathname]);

  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      if (link && canShowLoadingRef.current && link.href.startsWith(window.location.origin) && !link.target && !link.hasAttribute('download')) {
        setIsOpen(false);
        setIsLoading(true);
        setLoadingPath(pathnameRef.current);
      }
    };

    const handleSubmit = () => {
      if (canShowLoadingRef.current) {
        setIsLoading(true);
        setLoadingPath(null);
        window.setTimeout(() => setIsLoading(false), 5000);
      }
    };

    document.addEventListener('click', handleLinkClick);
    document.addEventListener('submit', handleSubmit);

    return () => {
      document.removeEventListener('click', handleLinkClick);
      document.removeEventListener('submit', handleSubmit);
    };
  }, []);

  return (
    <div className={styles.shell}>
      <MenuToggleButton isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />
      {isOpen && <div className={styles.overlay} onClick={() => setIsOpen(false)} />}
      {isLoading && canShowLoading && (loadingPath === null || loadingPath === pathname) && (
        <div className={styles.loadingBar} role="status" aria-label="Loading" />
      )}

      <aside
        ref={sidebarRef}
        className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}
      >
        {sidebarContent}
      </aside>

      {flash && <FlashToast type={flash.type} message={flash.message} />}
      {children}
    </div>
  );
}

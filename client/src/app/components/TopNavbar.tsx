import React from 'react';
import { FiSave, FiShare2, FiSettings, FiHelpCircle, FiUser } from 'react-icons/fi';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useRouter } from 'next/navigation';
import styles from './TopNavbar.module.css';

interface TopNavbarProps {
  projectName: string;
  onProjectNameChange: (name: string) => void;
}

const TopNavbar: React.FC<TopNavbarProps> = ({ projectName, onProjectNameChange }) => {
  const router = useRouter();

  const navigateToDashboard = (dashboardId: number) => {
    router.push(`/dashboard${dashboardId}`);
  };

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <div className={styles.appLogo}>VISplora</div>
        <div className={styles.divider}></div>
        <input
          type="text"
          value={projectName}
          onChange={(e) => onProjectNameChange(e.target.value)}
          className={styles.projectNameInput}
        />
      </div>

      <div className={styles.rightSection}>
        <button className={styles.saveButton}>
          <FiSave size={16} />
          <span>Save</span>
        </button>

        <div className={styles.divider}></div>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button type="button" className={styles.userMenuTrigger}>
              <FiUser size={16} className={styles.userIcon} />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className={styles.dropdownContent}
              sideOffset={5}
              align="end"
            >
              <DropdownMenu.Label className={styles.dropdownLabel}>
                Choose a dashboard to start
              </DropdownMenu.Label>

              <DropdownMenu.Item
                className={styles.dropdownItem}
                onSelect={() => navigateToDashboard(1)}
              >
                Dashboard 1
              </DropdownMenu.Item>

              <DropdownMenu.Item
                className={styles.dropdownItem}
                onSelect={() => navigateToDashboard(2)}
              >
                Dashboard 2
              </DropdownMenu.Item>

              <DropdownMenu.Item
                className={styles.dropdownItem}
                onSelect={() => navigateToDashboard(3)}
              >
                Dashboard 3
              </DropdownMenu.Item>

              <DropdownMenu.Item
                className={styles.dropdownItem}
                onSelect={() => navigateToDashboard(4)}
              >
                Dashboard 4
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
};

export default TopNavbar;

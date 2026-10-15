'use client';

import {
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent,
} from 'react';
import { Lock, UserRound, UserX, Wallet } from 'lucide-react';
import { CreditPanel, type CreditPanelLabels } from './CreditPanel';
import {
  DeleteAccountPanel,
  type DeleteAccountPanelLabels,
} from './DeleteAccountPanel';
import {
  ProfileDetailsPanel,
  type ProfileDetailsLabels,
} from './ProfileDetailsPanel';
import { SecurityPanel, type SecurityPanelLabels } from './SecurityPanel';
import {
  PROFILE_TABS,
  type ProfileTab,
  type ProfileUser,
} from '@/lib/profile/profile';

export interface ProfileSettingsLabels {
  tabsLabel: string;
  tabs: Record<ProfileTab, string>;
  details: ProfileDetailsLabels;
  credit: CreditPanelLabels;
  security: SecurityPanelLabels;
  deletion: DeleteAccountPanelLabels;
}

export interface ProfileSettingsProps {
  lng: 'el' | 'en';
  initialTab: ProfileTab;
  user: ProfileUser;
  labels: ProfileSettingsLabels;
}

const tabIcons: Record<ProfileTab, ComponentType<{ className?: string }>> = {
  details: UserRound,
  credit: Wallet,
  security: Lock,
  delete: UserX,
};

const tabBase =
  'inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 md:justify-start';
const tabOn = 'bg-accent text-accent-foreground';
const tabOff = 'text-muted-foreground hover:bg-secondary hover:text-foreground';
const tabDanger = 'text-destructive hover:bg-secondary';

export function ProfileSettings({
  lng,
  initialTab,
  user,
  labels,
}: ProfileSettingsProps) {
  const [tab, setTab] = useState<ProfileTab>(initialTab);
  const buttons = useRef<Record<string, HTMLButtonElement | null>>({});

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = PROFILE_TABS.indexOf(tab);
    let next = index;

    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      next = (index + 1) % PROFILE_TABS.length;
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      next = (index - 1 + PROFILE_TABS.length) % PROFILE_TABS.length;
    } else if (event.key === 'Home') {
      next = 0;
    } else if (event.key === 'End') {
      next = PROFILE_TABS.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    const target = PROFILE_TABS[next];
    setTab(target);
    buttons.current[target]?.focus();
  }

  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-8">
      <div
        role="tablist"
        aria-label={labels.tabsLabel}
        aria-orientation="vertical"
        onKeyDown={handleKeyDown}
        className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 md:mx-0 md:w-60 md:shrink-0 md:flex-col md:overflow-visible md:px-0 md:pb-0"
      >
        {PROFILE_TABS.map((item) => {
          const Icon = tabIcons[item];
          const selected = item === tab;
          const style = selected
            ? tabOn
            : item === 'delete'
              ? tabDanger
              : tabOff;

          return (
            <button
              key={item}
              ref={(node) => {
                buttons.current[item] = node;
              }}
              type="button"
              role="tab"
              id={`profile-tab-${item}`}
              aria-selected={selected}
              aria-controls={`profile-panel-${item}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setTab(item)}
              className={`${tabBase} ${style}`}
            >
              <Icon className="size-4" />
              {labels.tabs[item]}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`profile-panel-${tab}`}
        aria-labelledby={`profile-tab-${tab}`}
        className="min-w-0 flex-1 rounded-xl border-[0.5px] border-border bg-card p-4 sm:p-6"
      >
        {tab === 'details' ? (
          <ProfileDetailsPanel user={user} labels={labels.details} />
        ) : null}
        {tab === 'credit' ? (
          <CreditPanel lng={lng} labels={labels.credit} />
        ) : null}
        {tab === 'security' ? <SecurityPanel labels={labels.security} /> : null}
        {tab === 'delete' ? (
          <DeleteAccountPanel lng={lng} labels={labels.deletion} />
        ) : null}
      </div>
    </div>
  );
}

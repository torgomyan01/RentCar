'use client';

interface Tab {
  id: string;
  label: string;
}

interface CatalogTabsProps {
  tabs: Tab[];
  activeTabs: string[];
  onTabChange: (activeTabs: string[]) => void;
}

function CatalogTabs({ tabs, activeTabs, onTabChange }: CatalogTabsProps) {
  const handleTabClick = (tabId: string) => {
    if (tabId === 'all') {
      // If "Все" is clicked, toggle it and clear others
      onTabChange(activeTabs.includes('all') ? [] : ['all']);
    } else {
      // For other tabs, toggle them individually
      const withoutAll = activeTabs.filter((t) => t !== 'all');

      if (withoutAll.includes(tabId)) {
        // Remove tab if already selected
        const newTabs = withoutAll.filter((t) => t !== tabId);
        // If no tabs selected, select 'all'
        onTabChange(newTabs.length === 0 ? ['all'] : newTabs);
      } else {
        // Add tab
        onTabChange([...withoutAll, tabId]);
      }
    }
  };

  return (
    <div className="found-tab-menu">
      {tabs.map((tab) => {
        const isActive = activeTabs.includes(tab.id);
        return (
          <div
            key={tab.id}
            className={`found-tab-item ${isActive ? 'active' : ''}`}
            onClick={() => handleTabClick(tab.id)}
          >
            {tab.label}
          </div>
        );
      })}
    </div>
  );
}

export default CatalogTabs;

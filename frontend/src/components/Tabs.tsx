interface TabsProps {
  tabs: { id: string; label: string }[];
  activeTab: string;
  onChange: (id: string) => void;
}

export default function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 border-b border-border px-1">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative px-3.5 py-2.5 text-sm font-medium transition-colors
              ${isActive ? "text-text-primary" : "text-text-secondary hover:text-text-primary"}`}
          >
            {tab.label}
            {isActive && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent-500" />
            )}
          </button>
        );
      })}
    </div>
  );
}

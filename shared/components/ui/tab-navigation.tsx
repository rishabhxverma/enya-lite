"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@shared/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  content?: React.ReactNode;
}

interface TabNavigationProps {
  tabs: TabItem[];
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
  activeTab?: string;
}

export const TabNavigation = ({
  tabs,
  defaultTab,
  onTabChange,
  className,
  activeTab: controlledActiveTab,
}: TabNavigationProps) => {
  const [internalActiveTab, setInternalActiveTab] = useState(
    defaultTab || tabs[0]?.id,
  );
  const activeTab =
    controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;

  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [hoverStyle, setHoverStyle] = useState({ left: 0, width: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  useEffect(() => {
    const activeElement = tabRefs.current[activeTab];
    if (activeElement) {
      setIndicatorStyle({
        left: activeElement.offsetLeft,
        width: activeElement.offsetWidth,
      });
    }
  }, [activeTab, tabs]);

  const handleTabClick = (tabId: string) => {
    if (controlledActiveTab === undefined) {
      setInternalActiveTab(tabId);
    }
    onTabChange?.(tabId);
  };

  const handleMouseEnter = (tabId: string) => {
    const element = tabRefs.current[tabId];
    if (element) {
      setHoverStyle({
        left: element.offsetLeft,
        width: element.offsetWidth,
      });
      setIsHovering(true);
      setHoveredTab(tabId);
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setHoveredTab(null);
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="max-w-7xl mx-auto flex flex-row items-center justify-start flex-initial touch-pan-x overflow-x-auto scrollbar-none relative">
        <div
          className="flex h-full items-center px-2 md:px-4 *:shrink-0 relative"
          style={{ transform: "none" }}
          onMouseLeave={handleMouseLeave}
        >
          {/* Hover background with clip-path */}
          <div
            className="absolute inset-y-0 bg-zinc-100 transition-all duration-300 ease-out pointer-events-none rounded-lg shadow-md"
            style={{
              left: `${hoverStyle.left}px`,
              width: `${hoverStyle.width}px`,
              clipPath: "inset(8px 0px 8px 0px round 8px)",
              opacity: isHovering ? 1 : 0,
              willChange: "left, width, opacity",
              boxShadow: isHovering
                ? "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"
                : "none",
            }}
          />

          {tabs.map((tab) => (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[tab.id] = el;
              }}
              onClick={() => handleTabClick(tab.id)}
              onMouseEnter={() => handleMouseEnter(tab.id)}
              data-active={activeTab === tab.id}
              className={cn(
                "relative inline-block select-none px-3 py-4 no-underline transition-colors duration-300 z-10 cursor-pointer",
                "text-sm font-normal outline-offset-[-6px]",
                activeTab === tab.id
                  ? "text-zinc-900 font-medium"
                  : hoveredTab === tab.id
                    ? "text-zinc-700"
                    : "text-zinc-500",
              )}
              style={{
                willChange: "color",
              }}
            >
              {tab.label}
            </button>
          ))}
          <div
            className="absolute bottom-0 left-0 h-[2px] bg-zinc-900 transition-transform duration-150 origin-left"
            style={{
              transform: `translateX(${indicatorStyle.left}px) scaleX(${indicatorStyle.width / 100})`,
              width: "100px",
              display: indicatorStyle.width > 0 ? "block" : "none",
              willChange: "transform",
            }}
          />
        </div>
      </div>
    </div>
  );
};

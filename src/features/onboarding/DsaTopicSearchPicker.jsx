import React, { useState, useMemo, useRef, useEffect } from 'react';
import { getCatalogCategoriesApi, getCatalogTopicsApi } from '../../api/topicsApi';
import { Card } from '../../components/ui/Card';
import {
  Search,
  Sparkles,
  ChevronDown,
  ArrowRight,
  X,
  BookOpen,
  Loader2,
  Filter,
  RefreshCw,
  Server
} from 'lucide-react';

// Featured categories for quick filtering
const FEATURED_CATEGORIES = [
  'All Topics',
  '05. Arrays',
  '06. Strings',
  '08. Searching Algorithms',
  '10. Two Pointers',
  '11. Sliding Window',
  '13. Linked Lists',
  '14. Stacks',
  '18. Trees Fundamentals',
  '20. Binary Tree Problems',
  '21. Binary Search Trees',
  '23. Heaps and Priority Queues',
  '25. Graph Fundamentals',
  '26. Graph Traversal',
  '34. Dynamic Programming Fundamentals',
  '35. Classic Dynamic Programming Problems',
  '55. Classic Interview Problem Patterns',
  '56. Data Structure Design Problems',
];

export function DsaTopicSearchPicker({ onSelectTopic, isLoading = false }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Topics');
  const [selectedTopicPending, setSelectedTopicPending] = useState(null);
  const [showAllCategoriesDropdown, setShowAllCategoriesDropdown] = useState(false);
  const [visibleLimit, setVisibleLimit] = useState(36);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [topics, setTopics] = useState([]);
  const searchInputRef = useRef(null);

  // Fetch categories and topics from the backend canonical catalog
  const fetchBackendCatalog = async () => {
    setIsCatalogLoading(true);
    setCatalogError(null);
    try {
      const [catsRes, topicsRes] = await Promise.all([
        getCatalogCategoriesApi(),
        getCatalogTopicsApi({ page_size: 2000 })
      ]);

      const backendCategories = catsRes?.categories || [];
      const backendTopics = (topicsRes?.topics || []).map((t) => ({
        topic_id: t.topic_id,
        topic: t.name,
        category: t.category_name,
        category_id: t.category_id,
        kind: t.kind,
        assessment_mode: t.assessment_mode,
        pattern_tags: t.pattern_tags || [],
        description: t.description,
        normalized: `${t.name} ${t.category_name} ${(t.pattern_tags || []).join(' ')}`.toLowerCase(),
      }));

      setCategories(backendCategories);
      setTopics(backendTopics);
    } catch (err) {
      console.warn('[DsaTopicSearchPicker] Backend catalog fetch error:', err);
      setCatalogError('Could not load topics from server. Retrying...');
    } finally {
      setIsCatalogLoading(false);
    }
  };

  useEffect(() => {
    fetchBackendCatalog();
  }, []);

  // Global keyboard shortcut '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtered topics based on search query and category
  const filteredTopics = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let list = topics;

    if (selectedCategory !== 'All Topics') {
      list = list.filter((item) => item.category === selectedCategory);
    }

    if (!query) {
      return list;
    }

    const queryWords = query.split(/\s+/).filter(Boolean);
    return list.filter((item) => {
      return queryWords.every((word) => item.normalized.includes(word));
    });
  }, [topics, searchQuery, selectedCategory]);

  // Reset pagination limit when query or category changes
  useEffect(() => {
    setVisibleLimit(36);
  }, [searchQuery, selectedCategory]);

  const handleTopicClick = async (topicItem) => {
    if (isLoading) return;
    const topicIdOrName = topicItem?.topic_id || topicItem?.topic || topicItem;
    setSelectedTopicPending(topicIdOrName);
    try {
      await onSelectTopic(topicItem);
    } finally {
      setSelectedTopicPending(null);
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim() || isLoading) return;
    handleTopicClick(searchQuery.trim());
  };

  const handleClear = () => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  const visibleTopics = filteredTopics.slice(0, visibleLimit);
  const hasMore = visibleLimit < filteredTopics.length;

  return (
    <Card className="bg-[#111114] border border-[#292932] shadow-subtle p-5 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[#222229]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#8B7CFF]" />
            <h3 className="font-extrabold text-base sm:text-lg text-[#F4F4F5]">
              Choose Your DSA Topic
            </h3>
            {isCatalogLoading ? (
              <span className="text-[11px] font-semibold text-[#8B7CFF] bg-[#211C38] px-2 py-0.5 rounded-full border border-[#49406F] flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Loading Catalog...
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-[#8B7CFF] bg-[#211C38] px-2 py-0.5 rounded-full border border-[#49406F] flex items-center gap-1">
                <Server className="w-2.5 h-2.5 opacity-70" /> {topics.length} Canonical Topics
              </span>
            )}
          </div>
          <p className="text-xs text-[#A1A1AA]">
            Search dynamically across 60 comprehensive DSA modules or pick directly from the backend metadata catalog.
          </p>
        </div>

        {/* Category Dropdown Picker for all categories */}
        <div className="relative self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowAllCategoriesDropdown(!showAllCategoriesDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#16161B] hover:bg-[#1F1F27] border border-[#292932] hover:border-[#3E3E4A] rounded-xl text-xs font-semibold text-[#D4D4D8] transition-all cursor-pointer shadow-xs"
          >
            <Filter className="w-3.5 h-3.5 text-[#8B7CFF]" />
            <span className="max-w-[160px] truncate">
              {selectedCategory === 'All Topics' ? `All ${categories.length || 60} Categories` : selectedCategory}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-[#71717A] transition-transform ${showAllCategoriesDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showAllCategoriesDropdown && (
            <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 max-h-80 overflow-y-auto bg-[#16161B] border border-[#292932] rounded-2xl shadow-elevated z-30 p-2 space-y-1 backdrop-blur-md">
              <div className="px-3 py-1.5 text-[11px] font-bold text-[#71717A] uppercase tracking-wider">
                Select Category ({categories.length})
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('All Topics');
                  setShowAllCategoriesDropdown(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                  selectedCategory === 'All Topics'
                    ? 'bg-[#211C38] text-[#8B7CFF] font-bold'
                    : 'text-[#A1A1AA] hover:bg-[#202028] hover:text-[#F4F4F5]'
                }`}
              >
                <span>All Topics</span>
                <span className="text-[10px] text-[#71717A]">{topics.length}</span>
              </button>
              {categories.map((cat) => {
                const fullName = cat.full_name || cat.name;
                const isSelected = selectedCategory === fullName;
                return (
                  <button
                    key={cat.category_id || fullName}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(fullName);
                      setShowAllCategoriesDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#211C38] text-[#8B7CFF] font-bold'
                        : 'text-[#A1A1AA] hover:bg-[#202028] hover:text-[#F4F4F5]'
                    }`}
                  >
                    <span className="truncate pr-2">{fullName}</span>
                    <span className="text-[10px] text-[#71717A] shrink-0">{cat.topic_count}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Catalog Error Banner if network failed */}
      {catalogError && (
        <div className="p-3 bg-[#2D1214] border border-[#5C1D24] rounded-xl flex items-center justify-between text-xs text-rose-300">
          <span>{catalogError}</span>
          <button
            type="button"
            onClick={fetchBackendCatalog}
            className="flex items-center gap-1 font-semibold text-rose-200 hover:underline cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* Dynamic Search Box */}
      <form onSubmit={handleCustomSubmit} className="relative w-full">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-[#8B7CFF] absolute left-3.5 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topics (e.g., Binary Search, Two Sum, DP, Graphs, Linked Lists, Trees)..."
            className="w-full h-12 pl-10 pr-24 bg-[#16161B] border border-[#292932] focus:border-[#8B7CFF] focus:ring-2 focus:ring-[#8B7CFF]/20 rounded-xl text-sm text-[#F4F4F5] placeholder:text-[#71717A] transition-all shadow-inner"
          />
          <div className="absolute right-3 flex items-center gap-1.5">
            {searchQuery && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 text-[#71717A] hover:text-[#F4F4F5] rounded-lg hover:bg-[#202028] transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-[#71717A] bg-[#202028] border border-[#2E2E38] rounded-md">
              /
            </kbd>
          </div>
        </div>
      </form>

      {/* Quick Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-[#292932]">
        {FEATURED_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          const label = cat === 'All Topics' ? 'All' : cat.replace(/^\d+\.\s*/, '');
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer shrink-0 ${
                isSelected
                  ? 'bg-[#211C38] text-[#8B7CFF] border-[#49406F] shadow-xs'
                  : 'bg-[#16161B] text-[#A1A1AA] border-[#292932] hover:bg-[#1E1E26] hover:text-[#F4F4F5] hover:border-[#3E3E4A]'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Results Meta Info */}
      <div className="flex items-center justify-between text-xs text-[#71717A] pt-1">
        <span>
          Showing <strong className="text-[#F4F4F5]">{filteredTopics.length}</strong> {filteredTopics.length === 1 ? 'topic' : 'topics'}
          {selectedCategory !== 'All Topics' && (
            <span> in <span className="text-[#8B7CFF] font-medium">{selectedCategory}</span></span>
          )}
          {searchQuery && (
            <span> matching "<span className="text-[#F4F4F5]">{searchQuery}</span>"</span>
          )}
        </span>
        <span className="text-[11px] text-[#71717A] hidden sm:inline">Click any topic to select & configure</span>
      </div>

      {/* Dynamic Topic Listing Grid */}
      {isCatalogLoading && topics.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#8B7CFF] animate-spin" />
          <p className="text-xs text-[#A1A1AA]">Synchronizing canonical DSA topic catalog from backend...</p>
        </div>
      ) : filteredTopics.length > 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#292932]">
            {visibleTopics.map((item) => {
              const itemKey = item.topic_id || `${item.category}-${item.topic}`;
              const isPending = selectedTopicPending === item.topic_id || selectedTopicPending === item.topic;
              const catNumber = item.category.match(/^\d+/)?.[0] || '';
              const catCleanName = item.category.replace(/^\d+\.\s*/, '');

              return (
                <button
                  key={itemKey}
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleTopicClick(item)}
                  className={`group text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 relative overflow-hidden ${
                    isPending
                      ? 'bg-[#211C38] border-[#8B7CFF] ring-1 ring-[#8B7CFF] text-[#F4F4F5]'
                      : 'bg-[#16161B] border-[#24242D] hover:bg-[#1E1C2E] hover:border-[#49406F] hover:shadow-sm text-[#F4F4F5]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 w-full">
                    <span className="font-semibold text-xs sm:text-sm text-[#F4F4F5] group-hover:text-[#8B7CFF] transition-colors leading-snug">
                      {item.topic}
                    </span>
                    {isPending ? (
                      <Loader2 className="w-4 h-4 text-[#8B7CFF] animate-spin shrink-0 mt-0.5" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 text-[#71717A] group-hover:text-[#8B7CFF] group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5 opacity-60 group-hover:opacity-100" />
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 w-full pt-1">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#111114] border border-[#292932] text-[#8B7CFF]/90 font-medium">
                      #{catNumber}
                    </span>
                    <span className="text-[11px] text-[#71717A] truncate group-hover:text-[#A1A1AA] transition-colors">
                      {catCleanName}
                    </span>
                    {item.kind && item.kind !== 'technique' && (
                      <span className="text-[9px] uppercase px-1 rounded bg-[#202028] text-[#8B7CFF]/80 ml-auto shrink-0">
                        {item.kind.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Show More Button if topics list is large */}
          {hasMore && (
            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={() => setVisibleLimit((prev) => prev + 48)}
                className="px-4 py-1.5 bg-[#16161B] hover:bg-[#202028] border border-[#292932] hover:border-[#3E3E4A] rounded-xl text-xs font-semibold text-[#8B7CFF] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Load More Topics ({filteredTopics.length - visibleLimit} remaining)</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Empty Search State with Custom Topic Option */
        <div className="py-8 px-4 text-center rounded-2xl bg-[#16161B]/60 border border-[#292932] space-y-3">
          <BookOpen className="w-8 h-8 text-[#71717A] mx-auto" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-[#F4F4F5]">No matching DSA topic found</h4>
            <p className="text-xs text-[#A1A1AA] max-w-sm mx-auto">
              Want to learn a custom topic or technology outside the standard DSA curriculum?
            </p>
          </div>
          {searchQuery && (
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleTopicClick(searchQuery.trim())}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#6558F5] hover:bg-[#7568FF] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Start Assessment for "{searchQuery.trim()}"</span>
            </button>
          )}
        </div>
      )}
    </Card>
  );
}

export default DsaTopicSearchPicker;

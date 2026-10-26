/**
 * Den Deterministic Natural-Language Search Parser
 * Parses plain-English queries into structured filters with zero remote LLM dependencies.
 * Provides transparent "Understood as" removable chips.
 */

import { FileItem, SearchFilters, SearchInterpretationChip, FileKind, SourceType } from '../types/shelf';

export interface ParseResult {
  chips: SearchInterpretationChip[];
  filters: SearchFilters;
  textQuery: string;
  isLiteralFallback: boolean;
  unrecognizedTerms: string[];
}

export function parseNaturalQuery(rawQuery: string): ParseResult {
  const normalized = rawQuery.trim().toLowerCase();
  const chips: SearchInterpretationChip[] = [];
  const unrecognizedTerms: string[] = [];

  let queryText = normalized;
  let kind: FileKind | undefined = undefined;
  let source: SourceType | undefined = undefined;
  let dateRange: SearchFilters['dateRange'] = 'all';
  let sizeFilter: SearchFilters['sizeFilter'] = 'all';
  let isScreenshot = false;
  let hasExtractedTextQuery = false;

  if (!rawQuery.trim()) {
    return {
      chips: [],
      filters: {
        query: '',
        sortBy: 'date',
        sortOrder: 'desc',
      },
      textQuery: '',
      isLiteralFallback: false,
      unrecognizedTerms: [],
    };
  }

  // 1. Kind / Extension detection
  if (/\b(pdf|pdfs|documents?|docs?|sheets?|text)\b/.test(queryText)) {
    kind = 'document';
    chips.push({
      id: 'kind-doc',
      type: 'kind',
      label: queryText.includes('pdf') ? 'Kind: PDF' : 'Kind: Document',
      value: 'document',
    });
    queryText = queryText.replace(/\b(pdf|pdfs|documents?|docs?|sheets?)\b/g, '');
  } else if (/\b(videos?|movies?|clips?|mp4|mov)\b/.test(queryText)) {
    kind = 'video';
    chips.push({
      id: 'kind-video',
      type: 'kind',
      label: 'Kind: Video',
      value: 'video',
    });
    queryText = queryText.replace(/\b(videos?|movies?|clips?|mp4|mov)\b/g, '');
  } else if (/\b(images?|photos?|pictures?|jpg|png|svg)\b/.test(queryText)) {
    kind = 'image';
    chips.push({
      id: 'kind-image',
      type: 'kind',
      label: 'Kind: Image',
      value: 'image',
    });
    queryText = queryText.replace(/\b(images?|photos?|pictures?|jpg|png|svg)\b/g, '');
  } else if (/\b(music|audio|songs?|mp3|wav)\b/.test(queryText)) {
    kind = 'audio';
    chips.push({
      id: 'kind-audio',
      type: 'kind',
      label: 'Kind: Audio',
      value: 'audio',
    });
    queryText = queryText.replace(/\b(music|audio|songs?|mp3|wav)\b/g, '');
  } else if (/\b(archives?|zips?|tar|dmg|rar)\b/.test(queryText)) {
    kind = 'archive';
    chips.push({
      id: 'kind-archive',
      type: 'kind',
      label: 'Kind: Archive',
      value: 'archive',
    });
    queryText = queryText.replace(/\b(archives?|zips?|tar|dmg|rar)\b/g, '');
  } else if (/\b(apps?|applications?|binaries)\b/.test(queryText)) {
    kind = 'app';
    chips.push({
      id: 'kind-app',
      type: 'kind',
      label: 'Kind: App',
      value: 'app',
    });
    queryText = queryText.replace(/\b(apps?|applications?|binaries)\b/g, '');
  }

  // 2. Screenshot detection
  if (/\b(screenshots?|screen\s*grabs?)\b/.test(queryText)) {
    isScreenshot = true;
    kind = 'image';
    chips.push({
      id: 'screenshot',
      type: 'screenshot',
      label: 'Smart View: Screenshots',
      value: 'true',
    });
    queryText = queryText.replace(/\b(screenshots?|screen\s*grabs?)\b/g, '');
  }

  // 3. Source detection ("from gmail", "from google drive", "from slack", etc.)
  const sourceMatches: Array<{ pattern: RegExp; source: SourceType; label: string }> = [
    { pattern: /\b(from|on)\s+gmail\b/i, source: 'Gmail', label: 'Source: Gmail' },
    { pattern: /\b(from|on)\s+google\s*drive\b/i, source: 'Google Drive', label: 'Source: Google Drive' },
    { pattern: /\b(from|on)\s+slack\b/i, source: 'Slack', label: 'Source: Slack' },
    { pattern: /\b(from|on)\s+chatgpt\b/i, source: 'ChatGPT', label: 'Source: ChatGPT' },
    { pattern: /\b(from|on)\s+canva\b/i, source: 'Canva', label: 'Source: Canva' },
    { pattern: /\b(from|on)\s+whatsapp\b/i, source: 'WhatsApp', label: 'Source: WhatsApp' },
    { pattern: /\b(from|on)\s+github\b/i, source: 'GitHub', label: 'Source: GitHub' },
    { pattern: /\b(from|on)\s+browser\s*extensions?\b/i, source: 'Browser Extensions', label: 'Source: Extensions' },
  ];

  for (const m of sourceMatches) {
    if (m.pattern.test(rawQuery)) {
      source = m.source;
      chips.push({
        id: `source-${m.source}`,
        type: 'source',
        label: m.label,
        value: m.source,
      });
      queryText = queryText.replace(m.pattern, '');
      break;
    }
  }

  // 4. Date range detection ("from last week", "in august", "today", "last month")
  if (/\b(from\s+)?last\s+week\b/.test(queryText)) {
    dateRange = 'last_week';
    chips.push({
      id: 'date-last-week',
      type: 'date',
      label: 'Date: Last week',
      value: 'last_week',
    });
    queryText = queryText.replace(/\b(from\s+)?last\s+week\b/g, '');
  } else if (/\b(in\s+)?august\b/.test(queryText)) {
    dateRange = 'august';
    chips.push({
      id: 'date-august',
      type: 'date',
      label: 'Date: In August',
      value: 'august',
    });
    queryText = queryText.replace(/\b(in\s+)?august\b/g, '');
  } else if (/\btoday\b/.test(queryText)) {
    dateRange = 'today';
    chips.push({
      id: 'date-today',
      type: 'date',
      label: 'Date: Today',
      value: 'today',
    });
    queryText = queryText.replace(/\btoday\b/g, '');
  } else if (/\blast\s+month\b/.test(queryText)) {
    dateRange = 'last_month';
    chips.push({
      id: 'date-last-month',
      type: 'date',
      label: 'Date: Last month',
      value: 'last_month',
    });
    queryText = queryText.replace(/\blast\s+month\b/g, '');
  }

  // 5. Size detection ("over 5 mb", "larger than 5mb", "> 5 mb", "over 50 mb", "under 1 mb")
  if (/\b(over|larger\s+than|>)\s*5\s*mb\b/.test(queryText)) {
    sizeFilter = 'over_5mb';
    chips.push({
      id: 'size-over-5mb',
      type: 'size',
      label: 'Size: > 5 MB',
      value: 'over_5mb',
    });
    queryText = queryText.replace(/\b(over|larger\s+than|>)\s*5\s*mb\b/g, '');
  } else if (/\b(over|larger\s+than|>)\s*50\s*mb\b/.test(queryText)) {
    sizeFilter = 'over_50mb';
    chips.push({
      id: 'size-over-50mb',
      type: 'size',
      label: 'Size: > 50 MB',
      value: 'over_50mb',
    });
    queryText = queryText.replace(/\b(over|larger\s+than|>)\s*50\s*mb\b/g, '');
  } else if (/\b(under|smaller\s+than|<)\s*1\s*mb\b/.test(queryText)) {
    sizeFilter = 'under_1mb';
    chips.push({
      id: 'size-under-1mb',
      type: 'size',
      label: 'Size: < 1 MB',
      value: 'under_1mb',
    });
    queryText = queryText.replace(/\b(under|smaller\s+than|<)\s*1\s*mb\b/g, '');
  }

  // 6. Name keyword matching over indexed file metadata
  const cleanedRemainder = queryText
    .replace(/\b(from|in|my|on|all|the|a|an)\b/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

  if (cleanedRemainder.length > 0) {
    chips.push({
      id: 'text-keyword',
      type: 'text',
      label: 'Name: "' + cleanedRemainder + '"',
      value: cleanedRemainder,
    });
  }

  const isLiteralFallback = chips.length === 0 || (chips.length === 1 && chips[0].type === 'text');

  return {
    chips,
    filters: {
      query: cleanedRemainder,
      kind: kind || 'all',
      source: source || 'all',
      dateRange,
      sizeFilter,
      isScreenshot,
      sortBy: 'date',
      sortOrder: 'desc',
    },
    textQuery: cleanedRemainder,
    isLiteralFallback,
    unrecognizedTerms,
  };
}

export function filterFiles(files: FileItem[], filters: SearchFilters, rawText = ''): FileItem[] {
  return files.filter((file) => {
    // 1. Kind filter
    if (filters.kind && filters.kind !== 'all') {
      if (file.kind !== filters.kind) return false;
    }

    // 2. Source filter
    if (filters.source && filters.source !== 'all') {
      if (!file.sourceAttribution || file.sourceAttribution.source !== filters.source) {
        return false;
      }
    }

    // 3. Screenshot filter
    if (filters.isScreenshot) {
      if (!file.isScreenshot) return false;
    }

    // 4. Size filter
    if (filters.sizeFilter && filters.sizeFilter !== 'all') {
      const bytes = file.size;
      const MB = 1024 * 1024;
      if (filters.sizeFilter === 'under_1mb' && bytes >= 1 * MB) return false;
      if (filters.sizeFilter === '1mb_to_10mb' && (bytes < 1 * MB || bytes > 10 * MB)) return false;
      if (filters.sizeFilter === 'over_5mb' && bytes <= 5 * MB) return false;
      if (filters.sizeFilter === 'over_50mb' && bytes <= 50 * MB) return false;
      if (filters.sizeFilter === 'over_100mb' && bytes <= 100 * MB) return false;
    }

    // 5. Date filter
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      const modified = file.modifiedAt;

      if (filters.dateRange === 'today' && now - modified > oneDay) return false;
      if (filters.dateRange === 'last_week' && now - modified > 7 * oneDay) return false;
      if (filters.dateRange === 'last_month' && now - modified > 30 * oneDay) return false;
      if (filters.dateRange === 'august') {
        const fileMonth = new Date(modified).getMonth(); // 7 is August
        if (fileMonth !== 7) return false;
      }
    }

    // 6. Text query matching (name, extension, or extractedText)
    const term = (rawText || filters.query || '').trim().toLowerCase();
    if (term) {
      const inName = file.displayName.toLowerCase().includes(term);
      const inExt = file.extension.toLowerCase().includes(term);
      const inText = file.extractedText ? file.extractedText.toLowerCase().includes(term) : false;
      const inLocation = file.locationPath.toLowerCase().includes(term);

      if (!inName && !inExt && !inText && !inLocation) {
        return false;
      }
    }

    return true;
  });
}

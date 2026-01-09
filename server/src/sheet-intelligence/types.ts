export enum TabRole {
    PRIMARY_TASKS = 'PRIMARY_TASKS',
    PRIMARY_TIMELINE = 'PRIMARY_TIMELINE',
    PRIMARY_GANTT = 'PRIMARY_GANTT',
    PRIMARY_TEAM = 'PRIMARY_TEAM',
    DOCS_LINKS = 'DOCS_LINKS',
    KPI_METRICS = 'KPI_METRICS',
    LOOKUP = 'LOOKUP',
    ARCHIVE = 'ARCHIVE',
    UNKNOWN = 'UNKNOWN',
}

export interface SheetTabProfile {
    tabId: number;
    title: string;
    index: number;
    isHidden: boolean;
    gridProperties: {
        rowCount: number;
        columnCount: number;
    };

    // Classification result
    role: TabRole;
    confidence: number;
    decision: 'auto' | 'needs_review';

    // Scoring details
    scoreBreakdown: {
        nameHintScore: number;
        headerScore: number;
        structureScore: number;
    };

    // Assigned logic
    assignedExtractor: string | null;
}

export interface SheetStructure {
    spreadsheetId: string;
    title: string;
    tabs: SheetTabProfile[];
    timestamp: Date;
}

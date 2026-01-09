
import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// KPIData Schema (P0 Fix 1)
const KpiResultSchema = z.object({
    title: z.string(),
    value: z.union([z.number(), z.string()]),
    subtitle: z.string(),
    trend: z.object({
        value: z.number().optional(),
        direction: z.enum(['up', 'down', 'flat']).optional()
    }).optional(),
    tooltip: z.string().optional(),
    variant: z.enum(['good', 'bad', 'neutral', 'warning']).optional()
});

const KpiResponseSchema = z.array(KpiResultSchema);

// Status Breakdown Schema (P0 Fix 2)
const StatusBreakdownSchema = z.object({
    todo: z.number(),
    in_progress: z.number(),
    done: z.number(),
    total: z.number()
});

// Executive Summary Schema (P0 Fix 3)
const ExecutiveSummarySchema = z.object({
    headline: z.string(),
    bullets: z.array(z.string()),
    drivers: z.array(z.string()),
    missing_fields: z.array(z.string()),
    confidence: z.number()
});

describe('V1.5 API Contracts', () => {
    it('should validate KPIData[] structure', () => {
        const mockData = [
            {
                title: 'Active Project Days',
                value: 45,
                subtitle: 'days running',
                variant: 'neutral',
                tooltip: 'Days since potential project start detected from connection date'
            },
            {
                title: 'Milestone Progress',
                value: 85,
                subtitle: '% avg completion',
                variant: 'good',
                tooltip: 'Average completion percentage of all milestones'
            }
        ];

        // Should pass
        expect(() => KpiResponseSchema.parse(mockData)).not.toThrow();
    });

    it('should validate Status Breakdown structure', () => {
        const mockData = {
            todo: 5,
            in_progress: 2,
            done: 10,
            total: 17
        };

        // Should pass
        expect(() => StatusBreakdownSchema.parse(mockData)).not.toThrow();
    });

    it('should validate Executive Summary structure', () => {
        const mockData = {
            headline: 'Project is nearing completion.',
            bullets: ['Overall progress is at 85%.'],
            drivers: ['Milestone Completion', 'Task Velocity'],
            missing_fields: [],
            confidence: 0.9
        };

        // Should pass
        expect(() => ExecutiveSummarySchema.parse(mockData)).not.toThrow();
    });
});

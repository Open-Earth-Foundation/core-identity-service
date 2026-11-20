import { ComponentProps, ReactNode } from 'react';
export interface KeyFigureProps extends Omit<ComponentProps<'div'>, 'className'> {
    label: ReactNode;
    /** The figure, already formatted for the locale. */
    value: ReactNode;
    unit?: ReactNode;
    /** Change since the comparison period, e.g. "−4.2 % vs 2023". */
    delta?: ReactNode;
    /** Whether the delta is good or bad news; colour follows meaning, not sign. */
    deltaTone?: 'good' | 'bad' | 'neutral';
    /** Where the number comes from (principle 4): "Reported, 2024 inventory". */
    provenance?: ReactNode;
    className?: string;
}
/**
 * Anatomy: root > label + value(unit?) + delta?[data-tone] + provenance?
 */
export declare function KeyFigure({ label, value, unit, delta, deltaTone, provenance, className, ...rest }: KeyFigureProps): import('react').JSX.Element;

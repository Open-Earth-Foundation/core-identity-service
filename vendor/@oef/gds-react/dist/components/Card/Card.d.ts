import { ComponentProps, ReactNode } from 'react';
export interface CardProps extends Omit<ComponentProps<'section'>, 'title' | 'className'> {
    /** Small label above the title (a section, a sector). */
    eyebrow?: ReactNode;
    title?: ReactNode;
    /** Right-aligned controls in the header: a menu, a link. */
    actions?: ReactNode;
    footer?: ReactNode;
    /** Lift the card off the page with elevation.raised. Default: border only. */
    elevated?: boolean;
    className?: string;
}
/**
 * Anatomy: root > header(eyebrow?, title, actions?) + body + footer?
 * Props as data attributes: data-elevated.
 */
export declare function Card({ eyebrow, title, actions, footer, elevated, className, children, ...rest }: CardProps): import('react').JSX.Element;

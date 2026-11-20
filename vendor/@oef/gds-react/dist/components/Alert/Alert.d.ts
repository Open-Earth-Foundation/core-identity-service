import { ComponentProps, ReactNode } from 'react';
export type AlertKind = 'info' | 'good' | 'warning' | 'critical';
export interface AlertProps extends Omit<ComponentProps<'div'>, 'title' | 'className'> {
    kind?: AlertKind;
    title: ReactNode;
    /** A button or link that resolves the alert. */
    action?: ReactNode;
    className?: string;
}
/**
 * Anatomy: root[role=status|alert] > icon + body(title, text) + action?
 * Props as data attributes: data-kind.
 */
export declare function Alert({ kind, title, action, className, children, ...rest }: AlertProps): import('react').JSX.Element;

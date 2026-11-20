import { Button as BaseButton } from '@base-ui/react/button';
import { ComponentProps, ReactNode } from 'react';
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';
export interface ButtonProps extends Omit<ComponentProps<typeof BaseButton>, 'className'> {
    /** Visual weight. Default `primary`; one primary per view (principle 7). */
    variant?: ButtonVariant;
    size?: ButtonSize;
    /** Icon before the label. */
    iconStart?: ReactNode;
    /** Icon after the label. */
    iconEnd?: ReactNode;
    /** Icon-only button: square, and `aria-label` is required. */
    iconOnly?: boolean;
    className?: string;
}
/**
 * Anatomy: root > icon? + label + icon?
 * Props as data attributes: data-variant, data-size, data-icon-only.
 * State from Base UI: data-disabled. Focus: :focus-visible.
 */
export declare function Button({ variant, size, iconStart, iconEnd, iconOnly, className, children, ...rest }: ButtonProps): import('react').JSX.Element;

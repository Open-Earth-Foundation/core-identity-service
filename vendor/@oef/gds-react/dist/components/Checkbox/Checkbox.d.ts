import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import { ComponentProps, ReactNode } from 'react';
export interface CheckboxProps extends Omit<ComponentProps<typeof BaseCheckbox.Root>, 'className' | 'children'> {
    /** The visible label. Wraps the control so the whole row is the hit area. */
    children: ReactNode;
    className?: string;
}
/**
 * Anatomy: label.root > box(indicator) + text
 * State from Base UI Checkbox.Root: data-checked, data-unchecked, data-indeterminate, data-disabled.
 */
export declare function Checkbox({ children, className, ...rest }: CheckboxProps): import('react').JSX.Element;

import { Switch as BaseSwitch } from '@base-ui/react/switch';
import { ComponentProps, ReactNode } from 'react';
export interface SwitchProps extends Omit<ComponentProps<typeof BaseSwitch.Root>, 'className' | 'children'> {
    children: ReactNode;
    className?: string;
}
/**
 * Anatomy: label.root > track(thumb) + text
 * State from Base UI Switch.Root: data-checked, data-unchecked, data-disabled.
 */
export declare function Switch({ children, className, ...rest }: SwitchProps): import('react').JSX.Element;

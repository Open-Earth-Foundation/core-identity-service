import { Radio as BaseRadio } from '@base-ui/react/radio';
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group';
import { ComponentProps, ReactNode } from 'react';
export interface RadioGroupProps extends Omit<ComponentProps<typeof BaseRadioGroup>, 'className'> {
    /** Group label, read by assistive technology. */
    label: ReactNode;
    className?: string;
}
/**
 * Anatomy: group.root[role=radiogroup] > legend + Radio*
 * Each Radio: label.item > control(indicator) + text
 * State from Base UI Radio.Root: data-checked, data-unchecked, data-disabled.
 */
export declare function RadioGroup({ label, className, children, ...rest }: RadioGroupProps): import('react').JSX.Element;
export interface RadioProps extends Omit<ComponentProps<typeof BaseRadio.Root>, 'className' | 'children'> {
    children: ReactNode;
    className?: string;
}
export declare function Radio({ children, className, ...rest }: RadioProps): import('react').JSX.Element;

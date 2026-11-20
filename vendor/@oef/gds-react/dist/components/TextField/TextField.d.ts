import { Input } from '@base-ui/react/input';
import { ComponentProps, ReactNode } from 'react';
export interface TextFieldProps extends Omit<ComponentProps<typeof Input>, 'className'> {
    label: ReactNode;
    /** Shown under the control when there is no error. */
    description?: ReactNode;
    /** Shown instead of the description; sets the field invalid. */
    error?: ReactNode;
    /** Text after the value: a unit, a currency. */
    suffix?: ReactNode;
    required?: boolean;
    disabled?: boolean;
    name?: string;
    className?: string;
}
/**
 * Anatomy: field > label + control(input, suffix?) + help|error
 * State on the field (Base UI Field.Root): data-invalid, data-disabled, data-focused, data-filled.
 */
export declare function TextField({ label, description, error, suffix, required, disabled, name, className, ...input }: TextFieldProps): import('react').JSX.Element;

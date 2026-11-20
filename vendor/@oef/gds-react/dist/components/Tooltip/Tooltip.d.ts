import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import { ComponentProps, ReactElement, ReactNode } from 'react';
export interface TooltipProps extends Omit<ComponentProps<typeof BaseTooltip.Root>, 'children'> {
    /** The short text. Tooltips never hold anything the user needs to act on. */
    content: ReactNode;
    /** The element that triggers it; must accept a ref and be focusable. */
    children: ReactElement;
    side?: ComponentProps<typeof BaseTooltip.Positioner>['side'];
    className?: string;
}
/**
 * Anatomy: Root > Trigger(children) + Portal > Positioner > Popup(content)
 * State from Base UI: data-popup-open on the trigger; data-open/closed, data-side on the popup.
 * Wrap the app once in <TooltipProvider> for shared delays.
 */
export declare function Tooltip({ content, children, side, className, ...rest }: TooltipProps): import('react').JSX.Element;
export declare const TooltipProvider: import('react').FC<import('@base-ui/react').TooltipProviderProps>;

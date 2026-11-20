import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { ComponentProps, ReactNode } from 'react';
type PopupProps = Omit<ComponentProps<typeof BaseDialog.Popup>, 'className' | 'title'> & {
    className?: string;
    title: ReactNode;
    description?: ReactNode;
    /** Buttons, right-aligned. Put the primary action last. */
    footer?: ReactNode;
    /** Hide the corner close button (keep a Close in the footer then). */
    hideClose?: boolean;
};
declare function Popup({ className, title, description, footer, hideClose, children, ...rest }: PopupProps): import('react').JSX.Element;
/**
 * Anatomy: Root > Trigger + Popup(backdrop, header(title, close), description?, body?, footer?)
 * State from Base UI: data-open / data-closed on popup and backdrop, data-popup-open on the trigger.
 * Root, Trigger and Close are Base UI's; Trigger composes any element through `render`.
 */
export declare const Dialog: {
    Root: <Payload>(props: BaseDialog.Root.Props<Payload>) => React.JSX.Element;
    Trigger: BaseDialog.Trigger;
    Close: import('react').ForwardRefExoticComponent<Omit<import('@base-ui/react').AlertDialogCloseProps, "ref"> & import('react').RefAttributes<HTMLButtonElement>>;
    Popup: typeof Popup;
};
export {};

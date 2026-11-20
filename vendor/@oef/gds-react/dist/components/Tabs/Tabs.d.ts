import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import { ComponentProps, ReactNode } from 'react';
type RootProps = Omit<ComponentProps<typeof BaseTabs.Root>, 'className'> & {
    className?: string;
};
type ListProps = Omit<ComponentProps<typeof BaseTabs.List>, 'className'> & {
    className?: string;
};
type TabProps = Omit<ComponentProps<typeof BaseTabs.Tab>, 'className'> & {
    className?: string;
    /** A count shown after the label, e.g. number of rows. */
    count?: ReactNode;
};
type PanelProps = Omit<ComponentProps<typeof BaseTabs.Panel>, 'className'> & {
    className?: string;
};
declare function Root({ className, ...rest }: RootProps): import('react').JSX.Element;
declare function List({ className, children, ...rest }: ListProps): import('react').JSX.Element;
declare function Tab({ className, count, children, ...rest }: TabProps): import('react').JSX.Element;
declare function Panel({ className, ...rest }: PanelProps): import('react').JSX.Element;
/**
 * Anatomy: root > list(tab*, indicator) + panel*
 * State from Base UI: data-active on the selected tab, data-disabled, data-orientation.
 */
export declare const Tabs: {
    Root: typeof Root;
    List: typeof List;
    Tab: typeof Tab;
    Panel: typeof Panel;
};
export {};

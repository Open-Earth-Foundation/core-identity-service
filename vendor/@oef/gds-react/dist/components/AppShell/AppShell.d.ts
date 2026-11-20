import { ComponentProps, ReactNode } from 'react';
type RootProps = Omit<ComponentProps<'div'>, 'className'> & {
    className?: string;
};
type TopBarProps = Omit<ComponentProps<'header'>, 'className'> & {
    className?: string;
    /** Logo and service name. The brand mark goes here and only here. */
    brand: ReactNode;
    /** Programme, organisation or city switcher. */
    switcher?: ReactNode;
    /** Right side: help, notifications, account. */
    actions?: ReactNode;
};
type SideNavProps = Omit<ComponentProps<'nav'>, 'className'> & {
    className?: string;
};
type NavItemProps = Omit<ComponentProps<'a'>, 'className'> & {
    className?: string;
    icon?: ReactNode;
    current?: boolean;
    /** Journey step label, e.g. "1 of 4". */
    step?: ReactNode;
};
type MainProps = Omit<ComponentProps<'main'>, 'className'> & {
    className?: string;
};
type BreadcrumbProps = Omit<ComponentProps<'nav'>, 'className'> & {
    className?: string;
    items: ReactNode[];
};
type PageHeaderProps = Omit<ComponentProps<'div'>, 'className' | 'title'> & {
    className?: string;
    title: ReactNode;
    subtitle?: ReactNode;
    actions?: ReactNode;
};
/** The blank canvas state of a module slot. */
type EmptyProps = Omit<ComponentProps<'div'>, 'className' | 'title'> & {
    className?: string;
    title: ReactNode;
};
export declare const AppShell: {
    Root: ({ className, ...rest }: RootProps) => import('react').JSX.Element;
    TopBar: ({ className, brand, switcher, actions, ...rest }: TopBarProps) => import('react').JSX.Element;
    SideNav: ({ className, ...rest }: SideNavProps) => import('react').JSX.Element;
    NavGroup: ({ className, ...rest }: Omit<ComponentProps<"p">, "className"> & {
        className?: string;
    }) => import('react').JSX.Element;
    NavItem: ({ className, icon, current, step, children, ...rest }: NavItemProps) => import('react').JSX.Element;
    Main: ({ className, ...rest }: MainProps) => import('react').JSX.Element;
    Breadcrumb: ({ className, items, ...rest }: BreadcrumbProps) => import('react').JSX.Element;
    PageHeader: ({ className, title, subtitle, actions, ...rest }: PageHeaderProps) => import('react').JSX.Element;
    Empty: ({ className, title, children, ...rest }: EmptyProps) => import('react').JSX.Element;
};
export {};

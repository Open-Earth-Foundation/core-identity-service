import { ComponentProps } from 'react';
type RootProps = Omit<ComponentProps<'table'>, 'className'> & {
    className?: string;
    /** Alternate row backgrounds with table.row.striped.bg. */
    striped?: boolean;
};
type CellProps = Omit<ComponentProps<'td'>, 'className'> & {
    className?: string;
    /** Right-aligned, tabular figures (table.cell.numeric-type). */
    numeric?: boolean;
};
type HeaderCellProps = Omit<ComponentProps<'th'>, 'className'> & {
    className?: string;
    numeric?: boolean;
};
type RowProps = Omit<ComponentProps<'tr'>, 'className'> & {
    className?: string;
    selected?: boolean;
};
declare function Root({ className, striped, ...rest }: RootProps): import('react').JSX.Element;
/**
 * Anatomy: scroll > table.root[data-striped] > head(row > header-cell*) + body(row[data-selected]* > cell[data-numeric]*)
 * Plain semantic HTML; sorting, selection and pagination are the module's concern.
 */
export declare const Table: {
    Root: typeof Root;
    Head: ({ className, ...rest }: ComponentProps<"thead">) => import('react').JSX.Element;
    Body: ({ className, ...rest }: ComponentProps<"tbody">) => import('react').JSX.Element;
    Row: ({ className, selected, ...rest }: RowProps) => import('react').JSX.Element;
    HeaderCell: ({ className, numeric, ...rest }: HeaderCellProps) => import('react').JSX.Element;
    Cell: ({ className, numeric, ...rest }: CellProps) => import('react').JSX.Element;
    Empty: ({ className, colSpan, ...rest }: ComponentProps<"td">) => import('react').JSX.Element;
};
export {};

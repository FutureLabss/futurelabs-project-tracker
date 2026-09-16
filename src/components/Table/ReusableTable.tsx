import {
  ScrollArea,
  Table,
  Text,
} from '@mantine/core';
import type { ReactNode } from 'react';

export type TableColumn<T> = {
  key: string;
  label: string;
  width?: string | number;
  render?: (row: T) => ReactNode;
};

type ReusableTableProps<T extends { id: string | number }> = {
  columns: TableColumn<T>[];
  data: T[];
  emptyMessage?: string;
};

export function ReusableTable<
  T extends { id: string | number }
>({
  columns,
  data,
  emptyMessage = 'No records found',
}: ReusableTableProps<T>) {
  return (
    <ScrollArea type="auto">
      <Table
        horizontalSpacing="md"
        verticalSpacing="sm"
        highlightOnHover
        withColumnBorders={false}
        style={{
          minWidth: 1000,
        }}
      >
        <Table.Thead>
          <Table.Tr>
            {columns.map((column) => (
              <Table.Th
                key={column.key}
                style={{
                  width: column.width,
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#111827',
                  whiteSpace: 'nowrap',
                }}
              >
                {column.label}
              </Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>

        <Table.Tbody>
          {data.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={columns.length}>
                <Text
                  ta="center"
                  c="dimmed"
                  py="xl"
                  size="sm"
                >
                  {emptyMessage}
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            data.map((row) => (
              <Table.Tr key={row.id}>
                {columns.map((column) => (
                  <Table.Td
                    key={column.key}
                    style={{
                      verticalAlign: 'middle',
                    }}
                  >
                    {column.render
                      ? column.render(row)
                      : String(
                          row[
                            column.key as keyof T
                          ] ?? '',
                        )}
                  </Table.Td>
                ))}
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}
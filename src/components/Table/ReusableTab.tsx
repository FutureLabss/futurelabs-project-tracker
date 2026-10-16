import { Table, Paper, ScrollArea, LoadingOverlay, Text } from '@mantine/core';
import type { ReactNode } from 'react';

export interface ColumnDef<T> {
  header: string;
  accessorKey?: keyof T;
  render?: (item: T) => ReactNode;
  width?: string | number;
}

interface ReusableTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  loading?: boolean;
  onRowClick?: (item: T) => void;
  emptyLabel?: string;
}

export function ReusableTable<T extends { id?: string | number }>({
  columns,
  data,
  loading = false,
  onRowClick,
  emptyLabel = 'No records found',
}: ReusableTableProps<T>) {
  return (
    <Paper withBorder radius="md" p="md" pos="relative" bg="white">
      <LoadingOverlay visible={loading} />
      <ScrollArea>
        <Table verticalSpacing="md" horizontalSpacing="md" highlightOnHover={!!onRowClick}>
          <Table.Thead>
            <Table.Tr>
              {columns.map((col, index) => (
                <Table.Th key={index} style={{ width: col.width, color: '#475569', fontSize: 13 }}>
                  {col.header}
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.length > 0 ? (
              data.map((row, idx) => (
                <Table.Tr
                  key={row.id ?? idx}
                  style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col, cIdx) => (
                    <Table.Td key={cIdx} style={{ fontSize: 14 }}>
                      {col.render ? col.render(row) : (row[col.accessorKey as keyof T] as ReactNode)}
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))
            ) : (
              <Table.Tr>
                <Table.Td colSpan={columns.length} align="center">
                  <Text c="dimmed" py="xl" size="sm">
                    {emptyLabel}
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </Paper>
  );
}
import { createTheme, MantineColorsTuple } from '@mantine/core';

const futurelabsTeal: MantineColorsTuple = [
  '#e7fbf7',
  '#c8f4eb',
  '#98e8d9',
  '#65dbc6',
  '#3bd0b6',
  '#21c8aa',
  '#13aa91',
  '#0a8875',
  '#026d5f',
  '#00594f',
];

export const appTheme = createTheme({
  primaryColor: 'teal',
  colors: {
    teal: futurelabsTeal,
  },
  defaultRadius: 'sm',
  fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  headings: {
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  components: {
    ActionIcon: {
      defaultProps: {
        variant: 'subtle',
      },
    },
    Button: {
      defaultProps: {
        size: 'sm',
      },
    },
    Card: {
      defaultProps: {
        padding: 'md',
        radius: 'sm',
        withBorder: true,
      },
    },
    Paper: {
      defaultProps: {
        radius: 'sm',
        withBorder: true,
      },
    },
  },
});

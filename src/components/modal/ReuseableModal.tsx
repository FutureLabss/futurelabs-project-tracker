import {
  Button,
  Group,
  Modal,
} from '@mantine/core';

import type { ReactNode } from 'react';

type ReusableModalProps = {
  opened: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;

  onSubmit?: () => void;

  submitLabel?: string;

  loading?: boolean;

  submitDisabled?: boolean;

  size?: string | number;
};

export function ReusableModal({
  opened,
  onClose,
  title,
  children,
  onSubmit,
  submitLabel = 'Save',
  loading = false,
  submitDisabled = false,
  size = 'md',
}: ReusableModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
      size={size}
      centered
      closeOnClickOutside={false}
      closeOnEscape={false}
    >
      {children}

      <Group
        justify="flex-end"
        mt="xl"
      >
        <Button
          variant="default"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </Button>

        {onSubmit && (
          <Button
            color="teal"
            onClick={onSubmit}
            loading={loading}
            disabled={submitDisabled}
          >
            {submitLabel}
          </Button>
        )}
      </Group>
    </Modal>
  );
}
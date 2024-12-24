export const getStatusColor = (status: string, theme: any) => {
  switch (status) {
    case 'ACTIVE':
      return theme.colors.primaryContainer;
    case 'INACTIVE':
      return theme.colors.errorContainer;
    case 'MOVED_OUT':
      return theme.colors.surfaceVariant;
    default:
      return theme.colors.surfaceVariant;
  }
}; 
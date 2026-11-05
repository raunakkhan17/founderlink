// Utility helpers and functions
export const formatResponse = <T>(data: T, message = 'Success') => ({
  success: true,
  message,
  data,
});


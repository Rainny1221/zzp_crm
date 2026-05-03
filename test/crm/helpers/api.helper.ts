export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export function unwrap<T>(body: unknown): T {
  const response = body as ApiSuccess<T>;
  expect(response.success).toBe(true);
  return response.data;
}

export function expectBadRequest(body: unknown): void {
  const response = body as {
    success?: boolean;
    error?: {
      code?: string;
    };
  };

  expect(response.success).toBe(false);
  expect(response.error?.code).toBe('BAD_REQUEST');
}

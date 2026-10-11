import {
  paymentDeadline,
  type CancelSessionInput,
  type CancelSessionResult,
  type PaySessionResult,
  type RequestSessionInput,
  type RequestSessionResult,
  type RespondRequestResult,
} from '@/lib/coaches/coach-session';

function wait(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 500));
}

export async function requestCoachSession(
  input: RequestSessionInput,
): Promise<RequestSessionResult> {
  void input;
  await wait();
  return 'ok';
}

export async function respondCoachRequest(
  requestId: string,
  decision: 'accept' | 'reject',
): Promise<RespondRequestResult> {
  void requestId;
  await wait();
  if (decision === 'reject') return { status: 'ok', payBy: null };
  const now = new Date();
  return {
    status: 'ok',
    payBy: paymentDeadline(now, new Date(now.getTime() + 7 * 86_400_000)),
  };
}

export async function payCoachSession(
  sessionId: string,
): Promise<PaySessionResult> {
  void sessionId;
  await wait();
  return { status: 'ok' };
}

export async function cancelCoachSession(
  input: CancelSessionInput,
): Promise<CancelSessionResult> {
  void input;
  await wait();
  return { status: 'ok' };
}

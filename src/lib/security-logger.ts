type SecurityLogEntry = {
  timestamp: string;
  event: string;
  ip?: string;
  userId?: string;
  details: Record<string, unknown>;
};

export function logSecurityEvent(
  event: string,
  details: Record<string, unknown> & { ip?: string; userId?: string } = {}
): void {
  const { ip, userId, ...rest } = details;

  const entry: SecurityLogEntry = {
    timestamp: new Date().toISOString(),
    event,
    ...(ip ? { ip } : {}),
    ...(userId ? { userId } : {}),
    details: rest,
  };

  console.warn("[security]", JSON.stringify(entry));
}

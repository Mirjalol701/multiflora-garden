/** Client-safe admin check (email allowlist + role). */
const CLIENT_ADMIN_EMAILS = [
  "mirjieshkere@gmail.com",
  "mirjieshkeree@gmail.com",
];

export function isClientAdmin(user: {
  userRole?: string | null;
  email?: string | null;
} | null | undefined): boolean {
  if (!user) return false;
  if (user.userRole === "admin") return true;
  const email = user.email?.toLowerCase();
  return !!email && CLIENT_ADMIN_EMAILS.includes(email);
}

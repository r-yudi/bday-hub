export function isProtectedAppRoute(pathname: string | null) {
  if (!pathname) return false;
  return pathname === "/today" || pathname === "/upcoming" || pathname === "/share";
}

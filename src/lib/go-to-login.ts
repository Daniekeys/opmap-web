// Signing out, or finding the session has expired, leaves with a full page load
// on purpose: the router keeps a per-session cache in memory, and a soft
// navigation would carry it over to whoever signs in next in this tab.
export function goToLogin() {
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign("/login");
}

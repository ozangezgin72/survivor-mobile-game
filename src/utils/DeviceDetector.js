const MOBILE_USER_AGENT_PATTERN = /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i;
const MOBILE_WIDTH_THRESHOLD = 900;

function hasMobileUserAgent() {
  if (typeof navigator === 'undefined') {
    return false;
  }

  return MOBILE_USER_AGENT_PATTERN.test(navigator.userAgent);
}

function hasNarrowScreen() {
  if (typeof window === 'undefined') {
    return true;
  }

  return window.innerWidth < MOBILE_WIDTH_THRESHOLD;
}

/**
 * Mobil cihaz tespiti: user agent (Android/iPhone/iPad vb.) veya dar ekran genişliği.
 * İkisinden biri true ise mobil kabul edilir — tek başına UA veya genişlik yanıltıcı olabilir.
 */
export function isMobileDevice() {
  return hasMobileUserAgent() || hasNarrowScreen();
}

declare const __RELEASE_VERSION__: string;
declare const __RELEASE_COMMIT__: string;
declare const __RELEASE_BUILD_DATE__: string;

export const VERSION: string =
  typeof __RELEASE_VERSION__ !== 'undefined' ? __RELEASE_VERSION__ : '0.0.0-dev';
export const COMMIT: string =
  typeof __RELEASE_COMMIT__ !== 'undefined' ? __RELEASE_COMMIT__ : 'unknown';
export const BUILD_DATE: string =
  typeof __RELEASE_BUILD_DATE__ !== 'undefined' ? __RELEASE_BUILD_DATE__ : 'unknown';

export const VERSION_STRING = `${VERSION} (commit ${COMMIT}, built ${BUILD_DATE})`;

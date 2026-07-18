import { ACCENT_STORAGE_KEY, COLOR_MODE_STORAGE_KEY } from "@/lib/appearance";

/** Inline script to apply saved color mode + accent before first paint. */
export const THEME_INIT_SCRIPT = `(function(){try{var m=localStorage.getItem("${COLOR_MODE_STORAGE_KEY}");var s=JSON.parse(localStorage.getItem("${ACCENT_STORAGE_KEY}")||"{}");if(!m&&s.state&&s.state.theme==="dark")m="dark";if(!m)m="light";var d=m==="dark"||(m==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.classList.add("dark");var a=(s.state&&s.state.accent)||"green";document.documentElement.setAttribute("data-accent",a)}catch(e){}})();`;

/**
 * Runs in <head> before React. useEffect is too late — iOS "couldn't load" never mounts JS.
 * Unregisters SW + clears Cache API on Apple, then reloads once if the page was controlled.
 */
export const APPLE_SW_KILL_SCRIPT = `(function(){try{var ua=navigator.userAgent;var apple=/iPhone|iPod|iPad/.test(ua)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1)||(/Macintosh|Mac OS X/.test(ua)&&/Safari/.test(ua)&&!/Chrome|Chromium|Edg|Firefox|Opera/.test(ua));if(!apple||!("serviceWorker"in navigator))return;var controlled=!!navigator.serviceWorker.controller;navigator.serviceWorker.getRegistrations().then(function(regs){return Promise.all(regs.map(function(r){return r.unregister()})).then(function(){if(!("caches"in window))return;return caches.keys().then(function(keys){return Promise.all(keys.map(function(k){return caches.delete(k)}))})}).then(function(){if(controlled&&!sessionStorage.getItem("expensio-apple-sw-kill")){sessionStorage.setItem("expensio-apple-sw-kill","1");location.reload()}})})}catch(e){}})();`;

import { ACCENT_STORAGE_KEY, COLOR_MODE_STORAGE_KEY } from "@/lib/appearance";

/** Inline script to apply saved color mode + accent before first paint. */
export const THEME_INIT_SCRIPT = `(function(){try{var m=localStorage.getItem("${COLOR_MODE_STORAGE_KEY}");var s=JSON.parse(localStorage.getItem("${ACCENT_STORAGE_KEY}")||"{}");if(!m&&s.state&&s.state.theme==="dark")m="dark";if(!m)m="light";var d=m==="dark"||(m==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.classList.add("dark");var a=(s.state&&s.state.accent)||"green";document.documentElement.setAttribute("data-accent",a)}catch(e){}})();`;

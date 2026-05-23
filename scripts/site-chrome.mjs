/** Shared site header/footer (match profile About page). */

/**
 * @param {'home' | 'about' | null} active
 */
export function siteHeader(active) {
  const exp =
    active === "home"
      ? "font-code-label text-code-label text-console-black border-b-4 border-primary pb-1 uppercase no-underline"
      : "font-code-label text-code-label text-on-surface-variant hover:text-console-black transition-all uppercase no-underline";
  const about =
    active === "about"
      ? "font-code-label text-code-label text-console-black border-b-4 border-primary pb-1 uppercase no-underline"
      : "font-code-label text-code-label text-on-surface-variant hover:text-console-black transition-all uppercase no-underline";

  return `<header class="fixed top-0 left-0 right-0 z-50 bg-white border-b-2 border-window-border">
<nav class="flex justify-between items-center px-margin-mobile md:px-margin-desktop h-20 w-full max-w-[1440px] mx-auto">
<div class="flex items-center gap-2">
<a class="flex items-center gap-3 no-underline text-inherit hover:opacity-80 transition-opacity" href="/home/">
<img alt="" class="w-10 h-10 shrink-0 object-contain" height="40" src="/assets/icon.png" width="40"/>
<span class="font-display-lg text-headline-md font-black text-console-black uppercase tracking-tighter">MONA.EXE</span>
</a>
</div>
<div class="hidden md:flex gap-10 items-center">
<a class="${exp}" href="/home/">Experiments</a>
<a class="${about}" href="/profile/">About</a>
</div>
<div class="flex items-center">
<div class="flex items-center gap-2 bg-surface-container px-3 py-1 border-2 border-window-border">
<span class="w-2 h-2 bg-primary-container animate-pulse rounded-full shadow-[0_0_8px_rgba(0,255,102,0.6)] site-status-pip"></span>
<span class="font-code-label text-[11px] uppercase text-console-black">Online</span>
</div>
</div>
</nav>
</header>`;
}

export function siteFooter() {
  return `<footer class="bg-white border-t-4 border-window-border py-12 mt-auto">
<div class="max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-8">
<div class="flex flex-col items-center md:items-start gap-2">
<span class="font-display-lg text-headline-md text-console-black font-black uppercase">Mona.exe</span>
<span class="font-code-sm text-code-sm text-on-surface-variant uppercase font-bold">v1.0.4-stable // built for play</span>
</div>
<div class="flex flex-wrap justify-center gap-8 md:gap-12 items-center">
<a class="font-code-label text-code-label uppercase hover:text-primary transition-all border-b-2 border-transparent hover:border-primary no-underline inline-flex items-center gap-1" href="https://github.com/Mona776" target="_blank" rel="noopener noreferrer">
<span class="inline-flex shrink-0 w-[18px] h-[18px]" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12c0 5.52 3.66 10.19 8.68 11.85.63.12.86-.28.86-.63 0-.31-.01-1.36-.02-2.47-3.34.73-4.03-1.42-4.03-1.42-.55-1.38-1.35-1.96-1.35-1.96-1.1-.75.08-.73.08-.73 1.2.08 1.84 1.23 1.84 1.23 1.08 1.83 2.83 1.3 3.52.99.11-.77.43-1.32.78-1.65-2.66-.3-5.46-1.33-5.46-5.32 0-1.18.42-2.14 1.11-2.9-.11-.28-.48-1.39.11-2.87 0 0 .9-.29 2.96 1.14a10.3 10.3 0 0 1 2.74-.37c.93 0 1.86.12 2.74.37 2.06-1.43 2.96-1.14 2.96-1.14.59 1.48.22 2.59.11 2.87.69.76 1.11 1.72 1.11 2.9 0 3.99-2.81 5.02-5.48 5.29.44.38.83 1.12.83 2.27v3.36c0 .32.25.69.86.57A12 12 0 0 0 24 12 12 12 0 0 0 12 0z"/></svg></span>
GitHub
</a>
<a id="footer-email" class="font-code-label text-code-label uppercase hover:text-primary transition-all border-b-2 border-transparent hover:border-primary no-underline inline-flex items-center gap-1 cursor-pointer" href="mailto:mona0124@foxmail.com" data-email="mona0124@foxmail.com" title="复制邮箱并打开邮件">
<span class="material-symbols-outlined text-[18px] leading-none">mail</span>
Email
</a>
</div>
<div class="font-code-label text-code-label text-on-surface-variant uppercase font-bold opacity-30 text-center md:text-right">
© 2024 ALL_RIGHTS_RESERVED
</div>
</div>
</footer>`;
}

export const SITE_CHROME_SCRIPT = `<script>
document.addEventListener('DOMContentLoaded', () => {
  const pip = document.querySelector('.site-status-pip');
  if (pip) {
    document.addEventListener('mousemove', (e) => {
      const rect = pip.getBoundingClientRect();
      const dist = Math.hypot(e.clientX - rect.left, e.clientY - rect.top);
      pip.style.animationDuration = dist < 200 ? '0.2s' : '1.5s';
    });
  }
  const emailBtn = document.getElementById('footer-email');
  if (emailBtn) {
    emailBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const addr = emailBtn.dataset.email || 'mona0124@foxmail.com';
      try {
        await navigator.clipboard.writeText(addr);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = addr;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      window.location.href = 'mailto:' + addr;
    });
  }
});
</script>`;

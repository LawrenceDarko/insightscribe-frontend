import type { Metadata } from "next";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { Analytics } from "@vercel/analytics/next"
import "./globals.css";

export const metadata: Metadata = {
  title: "InsightScribe — AI Product Research Intelligence",
  description:
    "Turn hours of customer interviews into structured product insights instantly.",
};

/**
 * Inline script that runs before React hydrates to set the dark/light class
 * on <html>, preventing a flash of wrong theme.
 */
const themeInitScript = `
(function(){
  try {
    var t = localStorage.getItem('insightscribe-theme') || 'system';
    var d = t === 'system'
      ? (window.matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light')
      : t;
    document.documentElement.classList.add(d);
  } catch(e){}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="bg-surface-50 text-surface-900 dark:bg-surface-900 dark:text-surface-50 antialiased">
        <Analytics/>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>{children}</AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

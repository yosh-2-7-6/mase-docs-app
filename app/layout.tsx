import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

// Temporarily disable Stagewise toolbar to fix chunk loading error
const isDev = false; // process.env.NODE_ENV === 'development';
let StagewiseToolbar: any = () => null;

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Next.js and Supabase Starter Kit",
  description: "The fastest way to build apps with Next.js and Supabase",
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning={true}>
      <body className="bg-background text-foreground" suppressHydrationWarning={true}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {isDev && (
            <StagewiseToolbar
              config={{
                plugins: [], // Add your custom plugins here
              }}
            />
          )}
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
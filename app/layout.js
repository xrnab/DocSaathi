import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import Header from "@/components/header";
import { dark } from "@clerk/themes";
import { ThemeProvider } from "@/components/theme-provider";
import { OfflineIndicator } from "@/components/offline-indicator";
import { PageProgress } from "@/components/page-progress";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"] });

export const dynamic = "force-dynamic";

export const metadata = {
  title: "DocSaathi",
  description: "Connect with doctors anytime, anywhere",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="icon" href="/logo.png" sizes="any" />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                const originalRemoveChild = Node.prototype.removeChild;
                Node.prototype.removeChild = function(child) {
                  if (child.parentNode !== this) {
                    if (console) {
                      console.error('Target node is not a child of this node', child, this);
                    }
                    return child;
                  }
                  return originalRemoveChild.apply(this, arguments);
                };
              `,
            }}
          />
        </head>
        <body className={`${inter.className}`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <Suspense fallback={null}>
              <PageProgress />
            </Suspense>
            <Suspense fallback={
              <header className="fixed top-4 left-0 right-0 z-50 px-4 flex justify-center">
                <nav className="container max-w-7xl h-16 bg-background/70 backdrop-blur-xl border border-border rounded-[2rem] animate-pulse" />
              </header>
            }>
              <Header />
            </Suspense>
            <main className="min-h-screen pt-24">{children}</main>
            <Toaster richColors />
            <OfflineIndicator />

            <footer className="bg-muted/50 py-12">
              <div className="container mx-auto px-4 text-center text-muted-foreground">
                <p>&copy; {new Date().getFullYear()} DocSaathi. All rights reserved.</p>
              </div>
            </footer>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

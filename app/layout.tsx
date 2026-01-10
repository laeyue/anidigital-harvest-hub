import { Providers } from "@/components/Providers";
import "@/index.css";

export const metadata = {
  title: "AniDigital Harvest Hub",
  description: "A comprehensive agricultural platform for farmers in the Philippines",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/leaf-logo.svg" />
        <link rel="alternate icon" href="/leaf-logo.svg" />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}


import "./globals.css";

export const metadata = {
  title: "Chatify",
  description: "Chatify is a texting app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

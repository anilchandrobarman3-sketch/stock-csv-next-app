export const metadata = {
  title: "CSVNest Stock Lite — Pro",
  description: "Generate platform-ready metadata CSVs for stock sites",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

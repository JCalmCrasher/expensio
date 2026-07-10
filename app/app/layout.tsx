export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="font-app min-h-full flex flex-1 flex-col">{children}</div>;
}

import { Header } from "./Header";
import { Footer } from "./Footer";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />

      <main id="main-content" className="flex-1 overflow-auto" role="main">{children}</main>

      <Footer />
    </div>
  );
}

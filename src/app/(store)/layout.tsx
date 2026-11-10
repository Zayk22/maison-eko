import { CartProvider } from "@/components/cart/cart-context";
import { DemoNotice } from "@/components/ui/demo-notice";
import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
import { CartDrawer } from "@/components/cart/cart-drawer";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <DemoNotice />
      <Nav />
      <main id="main-content" className="flex-grow">
        {children}
      </main>
      <Footer />
      <CartDrawer />
    </CartProvider>
  );
}
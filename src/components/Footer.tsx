import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t border-primary/10 bg-background/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
                <Link href="/" className="inline-block h-12">
                  <Image 
                    src="/dira-logo-new.png" 
                    alt="Dira Logo" 
                    width={150} 
                    height={60} 
                    className="h-full w-auto object-contain"
                  />
                  <div className="font-signature text-xl text-primary/60 lowercase italic mt-1 pl-1">
                    Sakalya Wellbeing
                  </div>
                </Link>

              <p className="text-base font-serif italic text-muted-foreground max-w-xs">
                Sacred tools for spiritual enlightenment and authentic mystical guidance.
              </p>
            </div>


          <div>
            <h3 className="font-semibold mb-4 text-primary">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/shop" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Shop
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-primary">Categories</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/shop?category=decks" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Tarot Decks
                </Link>
              </li>
              <li>
                <Link href="/shop?category=crystals" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Crystals
                </Link>
              </li>
              <li>
                <Link href="/shop?category=books" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Books
                </Link>
              </li>
              <li>
                <Link href="/shop?category=accessories" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Accessories
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-primary">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/orders" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Track Order
                </Link>
              </li>
            </ul>
          </div>
        </div>

              <div className="mt-8 pt-8 border-t border-primary/10 text-center">
                <p className="text-base font-serif italic text-muted-foreground">
                  &copy; {new Date().getFullYear()} <span className="font-serif font-bold text-primary mx-1">Dira</span> Sakalya Wellbeing. All rights reserved.
                </p>

            <div className="flex justify-center items-center gap-2 mt-4 text-primary/40">
              <span>✦</span>
              <span className="text-sm tracking-[0.3em] font-serif uppercase">Sacred Wisdom</span>
              <span>✦</span>
            </div>
          </div>

      </div>
    </footer>
  );
}
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Package2 } from "lucide-react";
import { Nav } from "./nav";

export function AppShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            <div className="hidden border-r bg-card md:block">
                <div className="flex h-full max-h-screen flex-col gap-2">
                    <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                        <a href="/" className="flex items-center gap-2 font-semibold font-headline">
                            <Package2 className="h-6 w-6 text-primary" />
                            <span className="">Baitul Mal</span>
                        </a>
                    </div>
                    <div className="flex-1">
                        <Nav />
                    </div>
                </div>
            </div>
            <div className="flex flex-col">
                <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="shrink-0 md:hidden"
                            >
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle navigation menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="flex flex-col">
                            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                                <a href="/" className="flex items-center gap-2 font-semibold font-headline">
                                    <Package2 className="h-6 w-6 text-primary" />
                                    <span className="">Baitul Mal</span>
                                </a>
                            </div>
                            <Nav />
                        </SheetContent>
                    </Sheet>
                     <div className="w-full flex-1">
                        {/* Can add a search bar here if needed */}
                    </div>
                </header>
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
                    {children}
                </main>
            </div>
        </div>
    )
}

'use client'

import { Menu } from "lucide-react"
import { Button } from "./ui/button"
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet"
import SideBar from "./sideBar"
import { useEffect, useState } from "react"

const MobileSidebar = () => {
    // const [isMounted, setIsMounted] = useState(false);

    // useEffect(() => {
    //     setIsMounted(true);
    // }, [])

    // if(!isMounted) {
    //     return null;
    // }
    return (
        <Sheet> 
         <SheetTrigger>
            <div>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu/>
                </Button>
            </div> 
         </SheetTrigger>
            <SheetContent side="left" className="p-0">
                <SideBar/>
            </SheetContent>
        </Sheet>
       
    )
}

export default MobileSidebar
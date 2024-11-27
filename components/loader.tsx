import Image from "next/image";

const Loader = () => {
    return (
        <div className="h-full flex flex-col gap-y-4 items-center">
            <div className="w-10 h-10 relative animate-bounce">
                <Image alt="logo" fill src="/Almer.png"/>
            </div>
            <p className="text-sm text-muted-foreground">
                Almer is still collecting data...
            </p>
        </div>
    )
}

export default Loader;
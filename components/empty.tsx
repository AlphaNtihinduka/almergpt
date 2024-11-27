import Image from "next/image";

interface EmptyProps {
    label: string;

}
const Empty = ({
    label
}: EmptyProps) => {
    return(
        <div className="h-full p-20 flex flex-col items-center justify-center">
                      <p className="text-muted-forebackground text-sm
            text-center text-red-500">
                {label}
            </p>
            <div className="relative h-72 w-72">
                <Image alt="Empty" fill src="/empty.gif"/>
            </div>
  
        </div>
    )
}

export default Empty
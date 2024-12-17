import { userApiLimit } from './../node_modules/.prisma/client/index.d';
import { auth } from "@clerk/nextjs/server";

import prismadb from "./prismadb";

import { MAX_FREE_COUNTS } from "@/constants";

export const increaseApiLimit = async () => {
    const { userId } = await auth();

    if(!userId) {
        return;
    }

    const userApiLimit = await prismadb.userApiLimit
}
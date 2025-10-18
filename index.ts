import moment from "moment";
import { PrismaClient } from "./generated/prisma";
import { z } from "zod";

const prisma = new PrismaClient();

const csvData = await Bun.file("./SaaS-Sales.csv").text()

const values = csvData.split("\r\n").map((line)=> line.split(","));

const inputLine = z.object({
    id: z.string().transform((val) => parseInt(val)),
    orderId: z.string(),
    date: z.string().transform((val) => moment(val, "YYYYMMDD").toDate()),
    contactName: z.string(),
    country: z.string(),
    city: z.string(),
    region: z.string(),
    subregion: z.string(),
    customerName: z.string(),
    customerId: z.string().transform((val) => parseInt(val)),
    industry: z.string(),
    segment: z.string(),
    product: z.string(),
    sales: z.string().transform((val) => parseFloat(val)),
    quantity: z.string().transform((val) => parseInt(val)),
    discount: z.string().transform((val) => parseFloat(val)),
    profit: z.string().transform((val) => parseFloat(val)),
});


for (const [index, line] of values.entries()) {
    if(index === 0) continue; // skip header row
    const sale = inputLine.parse({
        id: line[0],
        orderId: line[1],
        date: line[3],
        contactName: line[4],
        country: line[5],
        city: line[6],
        region: line[7],
        subregion: line[8],
        customerName: line[9],
        customerId: line[10],
        industry: line[11],
        segment: line[12],
        product: line[13],
        sales: line[15],
        quantity: line[16],
        discount: line[17],
        profit: line[18],
    });
    await prisma.customer.upsert({
        where: { id: sale.customerId },
        update: {},
        create: {
            id: sale.customerId,
            name: sale.customerName,
            country: sale.country,
            city: sale.city,
            region: sale.region,
            subregion: sale.subregion,
            contact: sale.contactName,
            industry: sale.industry,
            segment: sale.segment,
        }
    });

    await prisma.sale.create({
        data: { 
            id: sale.id,
            orderId: sale.orderId,
            orderDate: sale.date,
            customer: {
                connect: { id: sale.customerId }
            },
            product: sale.product,
            salesAmount: sale.sales,
            quantity: sale.quantity,
            discount: sale.discount,
            profit: sale.profit,
        }
    });
    console.log(`Uploaded sale ${index}/${values.length}`);
}
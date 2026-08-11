import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
    const passwordHash = await bcrypt.hash("secret123", 12);

    // --- users ---
    const admin = await prisma.user.upsert({
        where: { email: "admin@shop.com" },
        update: {},
        create: { name: "Admin", email: "admin@shop.com", password: passwordHash, role: "ADMIN" },
    });
    const customer = await prisma.user.upsert({
        where: { email: "customer@shop.com" },
        update: {},
        create: { name: "Customer", email: "customer@shop.com", password: passwordHash, role: "USER" },
    });

    // --- categories ---
    const electronics = await prisma.category.upsert({
        where: { id: "seed-cat-electronics" },
        update: { name: "Electronics" },
        create: { id: "seed-cat-electronics", name: "Electronics" },
    });
    const books = await prisma.category.upsert({
        where: { id: "seed-cat-books" },
        update: { name: "Books" },
        create: { id: "seed-cat-books", name: "Books" },
    });
    const clothing = await prisma.category.upsert({
        where: { id: "seed-cat-clothing" },
        update: { name: "Clothing" },
        create: { id: "seed-cat-clothing", name: "Clothing" },
    });

    // --- products ---
    const seedProducts = [
        { id: "seed-prod-mouse", name: "Wireless Mouse", price: 1500, stock: 15, categoryId: electronics.id },
        { id: "seed-prod-keyboard", name: "Mechanical Keyboard", price: 4500, stock: 8, categoryId: electronics.id },
        { id: "seed-prod-headphones", name: "Headphones", price: 3000, stock: 0, categoryId: electronics.id },
        { id: "seed-prod-jsnotes", name: "JavaScript Notes", price: 400, stock: 50, categoryId: books.id },
        { id: "seed-prod-novel", name: "Mystery Novel", price: 350, stock: 20, categoryId: books.id },
        { id: "seed-prod-tshirt", name: "Cotton T-Shirt", price: 600, stock: 30, categoryId: clothing.id },
    ];
    for (const p of seedProducts) {
        await prisma.product.upsert({
            where: { id: p.id },
            update: { name: p.name, price: p.price, stock: p.stock, categoryId: p.categoryId },
            create: p,
        });
    }

    console.log("Seed done.");
    console.log(`Users: admin(${admin.email}), customer(${customer.email})`);
    console.log("Login password for both: secret123");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());

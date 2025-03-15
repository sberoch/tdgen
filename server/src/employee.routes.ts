import * as express from "express";
import { PrismaClient } from '@prisma/client'

export const employeeRouter = express.Router();
employeeRouter.use(express.json());

const prisma = new PrismaClient()

employeeRouter.get("/", async (_req, res) => {
    try {
        const employees = await prisma.employee.findMany();
        res.status(200).send(employees);
    } catch (error) {
        res.status(500).send(error instanceof Error ? error.message : "Unknown error");
    }
});

employeeRouter.get("/:id", async (req, res) => {
    try {
        const id = req?.params?.id;
        const employee = await prisma.employee.findUnique({
            where: {
                id: parseInt(id)
            }
        });
        if (employee) {
            res.status(200).send(employee);
        } else {
            res.status(404).send(`Failed to find an employee: ID ${id}`);
        }
    } catch (error) {
        res.status(404).send(`Failed to find an employee: ID ${req?.params?.id}`);
    }
});

employeeRouter.post("/", async (req, res) => {
    try {
        const employee = req.body;
        const result = await prisma.employee.create({
            data: employee
        });
        if (result?.id) {
            res.status(201).send(`Created a new employee: ID ${result.id}.`);
        } else {
            res.status(500).send("Failed to create a new employee.");
        }
    } catch (error) {
        console.error(error);
        res.status(400).send(error instanceof Error ? error.message : "Unknown error");
    }
});

employeeRouter.put("/:id", async (req, res) => {
    try {
        const id = req?.params?.id;
        const employee = req.body;
        const result = await prisma.employee.update({
            where: { id: Number(id) },
            data: employee
        });
        if (result) {
            res.status(200).send(`Updated an employee: ID ${id}.`);
        } else {
            res.status(304).send(`Failed to update an employee: ID ${id}`);
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(message);
        res.status(400).send(message);
    }
});

employeeRouter.delete("/:id", async (req, res) => {
    const id = req?.params?.id;
    try {
        const result = await prisma.employee.delete({
            where: {
                id: parseInt(id)
            }
        });
        if (result) {
            res.status(202).send(`Removed an employee: ID ${id}`);
        } else {
            res.status(400).send(`Failed to remove an employee: ID ${id}`);
        }

    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(message);
        res.status(400).send(message);
    }
});

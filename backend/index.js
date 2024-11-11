const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');

const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use(cors());

// List medicines with optional category, medId, and name filter
app.get('/api/medicines', async (req, res) => {
  const { category, medId, name } = req.query; // Read category, medId, and name from query params
  try {
    const filterConditions = {};

    if (category) {
      filterConditions.category = category;
    }
    if (medId) {
      filterConditions.medicineId = parseInt(medId); // Assuming medicineId is an integer
    }
    if (name) {
      filterConditions.name = {
        contains: name, // Partial match for name
        mode: 'insensitive', // Case-insensitive search
      };
    }

    const medicines = await prisma.medicine.findMany({
      where: filterConditions,
    });

    console.log('Filtered Medicines:', medicines);
    res.json(medicines);
  } catch (error) {
    console.error('Error fetching medicines:', error);
    res.status(500).json({ error: 'Failed to fetch medicines' });
  }
});

app.post('/api/medicines', async (req, res) => {
  const { medicineId, name, description, price, stockQty, expiryDate, category } = req.body;
  try {
    const newMedicine = await prisma.medicine.create({
      data: {
        medicineId,
        name,
        description,
        price,
        stockQty,
        expiryDate: new Date(expiryDate),
        category
      },
    });
    res.status(201).json(newMedicine);
  } catch (error) {
    console.error('Error adding new medicine:', error);
    res.status(500).json({ error: 'Failed to add medicine' });
  }
});

// Update an existing medicine
app.put('/api/medicines/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, price, stockQty, expiryDate, category } = req.body;
  try {
    const updatedMedicine = await prisma.medicine.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        price,
        stockQty,
        expiryDate: new Date(expiryDate),
        category
      },
    });
    res.json(updatedMedicine);
  } catch (error) {
    console.error('Error updating medicine:', error);
    res.status(500).json({ error: 'Failed to update medicine' });
  }
});

// Delete a medicine
app.delete('/api/medicines/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.medicine.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting medicine:', error);
    res.status(500).json({ error: 'Failed to delete medicine' });
  }
});

// Get medicines with low stock
app.get('/api/medicines/low-stock', async (req, res) => {
  const threshold = parseInt(req.query.threshold) || 10;
  try {
    const lowStockMedicines = await prisma.medicine.findMany({
      where: {
        stockQty: { lt: threshold },
      },
    });
    res.json(lowStockMedicines);
  } catch (error) {
    console.error('Error fetching low stock medicines:', error);
    res.status(500).json({ error: 'Failed to fetch low stock medicines' });
  }
});

// Get medicines near expiry
app.get('/api/medicines/near-expiry', async (req, res) => {
  const daysUntilExpiry = parseInt(req.query.days) || 30;
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + daysUntilExpiry);

  try {
    const nearExpiryMedicines = await prisma.medicine.findMany({
      where: {
        expiryDate: { lt: expiryDate },
      },
    });
    res.json(nearExpiryMedicines);
  } catch (error) {
    console.error('Error fetching near-expiry medicines:', error);
    res.status(500).json({ error: 'Failed to fetch near-expiry medicines' });
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server running on port:', PORT);
});

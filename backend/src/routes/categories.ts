import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Schema di validazione per le categorie
const categorySchema = z.object({
  name: z.string().min(1, 'Il nome è obbligatorio'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Colore non valido (formato hex)')
});

// Schema per aggiornamento categoria
const categoryUpdateSchema = categorySchema.partial();

// Proteggi tutte le route
router.use(authenticateToken);

// GET /api/categories - Lista tutte le categorie dell'utente
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const categories = await prisma.category.findMany({
      where: { userId },
      include: {
        _count: {
          select: { tasks: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ categories });

  } catch (error) {
    console.error('Errore recupero categorie:', error);
    res.status(500).json({
      error: 'Errore interno del server'
    });
  }
});

// GET /api/categories/:id - Recupera una categoria specifica
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const category = await prisma.category.findFirst({
      where: { id, userId },
      include: {
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { tasks: true }
        }
      }
    });

    if (!category) {
      return res.status(404).json({
        error: 'Categoria non trovata'
      });
    }

    res.json({ category });

  } catch (error) {
    console.error('Errore recupero categoria:', error);
    res.status(500).json({
      error: 'Errore interno del server'
    });
  }
});

// POST /api/categories - Crea una nuova categoria
router.post('/', async (req: Request, res: Response) => {
  try {
    const categoryData = categorySchema.parse(req.body);
    const userId = req.user!.id;

    // Verifica che non esista già una categoria con lo stesso nome per questo utente
    const existingCategory = await prisma.category.findFirst({
      where: { 
        name: categoryData.name,
        userId 
      }
    });

    if (existingCategory) {
      return res.status(400).json({
        error: 'Esiste già una categoria con questo nome'
      });
    }

    const category = await prisma.category.create({
      data: {
        ...categoryData,
        userId
      }
    });

    res.status(201).json({
      message: 'Categoria creata con successo',
      category
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dati non validi',
        details: error.errors
      });
    }

    console.error('Errore creazione categoria:', error);
    res.status(500).json({
      error: 'Errore interno del server'
    });
  }
});

// PUT /api/categories/:id - Aggiorna una categoria
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const updateData = categoryUpdateSchema.parse(req.body);

    // Verifica che la categoria esista e appartenga all'utente
    const existingCategory = await prisma.category.findFirst({
      where: { id, userId }
    });

    if (!existingCategory) {
      return res.status(404).json({
        error: 'Categoria non trovata'
      });
    }

    // Se si sta cambiando il nome, verifica che non esista già
    if (updateData.name && updateData.name !== existingCategory.name) {
      const duplicateCategory = await prisma.category.findFirst({
        where: { 
          name: updateData.name,
          userId,
          id: { not: id }
        }
      });

      if (duplicateCategory) {
        return res.status(400).json({
          error: 'Esiste già una categoria con questo nome'
        });
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });

    res.json({
      message: 'Categoria aggiornata con successo',
      category: updatedCategory
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dati non validi',
        details: error.errors
      });
    }

    console.error('Errore aggiornamento categoria:', error);
    res.status(500).json({
      error: 'Errore interno del server'
    });
  }
});

// DELETE /api/categories/:id - Elimina una categoria
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Verifica che la categoria esista e appartenga all'utente
    const category = await prisma.category.findFirst({
      where: { id, userId },
      include: {
        _count: {
          select: { tasks: true }
        }
      }
    });

    if (!category) {
      return res.status(404).json({
        error: 'Categoria non trovata'
      });
    }

    // Se la categoria ha task associate, non permettere l'eliminazione
    if (category._count.tasks > 0) {
      return res.status(400).json({
        error: 'Non è possibile eliminare una categoria che ha task associate. Sposta prima le task in un\'altra categoria.'
      });
    }

    await prisma.category.delete({
      where: { id }
    });

    res.json({
      message: 'Categoria eliminata con successo'
    });

  } catch (error) {
    console.error('Errore eliminazione categoria:', error);
    res.status(500).json({
      error: 'Errore interno del server'
    });
  }
});

// GET /api/categories/:id/stats - Statistiche per categoria
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Verifica che la categoria esista e appartenga all'utente
    const category = await prisma.category.findFirst({
      where: { id, userId }
    });

    if (!category) {
      return res.status(404).json({
        error: 'Categoria non trovata'
      });
    }

    // Calcola statistiche
    const [totalTasks, completedTasks, pendingTasks, inProgressTasks] = await Promise.all([
      prisma.task.count({ where: { categoryId: id, userId } }),
      prisma.task.count({ where: { categoryId: id, userId, status: 'COMPLETED' } }),
      prisma.task.count({ where: { categoryId: id, userId, status: 'PENDING' } }),
      prisma.task.count({ where: { categoryId: id, userId, status: 'IN_PROGRESS' } })
    ]);

    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    res.json({
      stats: {
        totalTasks,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        completionRate: Math.round(completionRate * 100) / 100
      }
    });

  } catch (error) {
    console.error('Errore recupero statistiche categoria:', error);
    res.status(500).json({
      error: 'Errore interno del server'
    });
  }
});

export default router;

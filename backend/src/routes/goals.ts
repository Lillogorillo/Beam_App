import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Schema di validazione per gli obiettivi
const goalSchema = z.object({
  title: z.string().min(1, 'Il titolo è obbligatorio'),
  description: z.string().optional(),
  target: z.number().min(1, 'L\'obiettivo deve essere maggiore di 0'),
  current: z.number().min(0).default(0),
  unit: z.string().min(1, 'L\'unità è obbligatoria'),
  deadline: z.string().datetime().optional(),
  completed: z.boolean().default(false)
});

// Schema per aggiornamento obiettivo
const goalUpdateSchema = goalSchema.partial();

// Proteggi tutte le route
router.use(authenticateToken);

// GET /api/goals - Lista tutti gli obiettivi dell'utente
router.get('/', async (req: Request, res: Response) => {
  try {
    const { 
      completed, 
      search,
      page = '1',
      limit = '20'
    } = req.query;

    const userId = req.user!.id;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Costruisci i filtri
    const where: any = { userId };
    
    if (completed !== undefined) {
      where.completed = completed === 'true';
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    // Esegui query con paginazione
    const [goals, total] = await Promise.all([
      prisma.goal.findMany({
        where,
        orderBy: [
          { completed: 'asc' },
          { deadline: 'asc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limitNum
      }),
      prisma.goal.count({ where })
    ]);

    res.json({
      goals,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Errore recupero obiettivi:', error);
    res.status(500).json({
      error: 'Errore interno del server'
    });
  }
});

// GET /api/goals/stats - Statistiche degli obiettivi
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Calcola statistiche
    const [totalGoals, completedGoals, activeGoals, overdueGoals] = await Promise.all([
      prisma.goal.count({ where: { userId } }),
      prisma.goal.count({ where: { userId, completed: true } }),
      prisma.goal.count({ where: { userId, completed: false } }),
      prisma.goal.count({ 
        where: { 
          userId, 
          completed: false,
          deadline: { lt: new Date() }
        }
      })
    ]);

    const completionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

    // Obiettivi per unità
    const goalsByUnit = await prisma.goal.groupBy({
      by: ['unit'],
      where: { userId },
      _count: { id: true },
      _sum: { target: true, current: true }
    });

    // Progresso medio per obiettivo
    const avgProgress = await prisma.goal.aggregate({
      where: { userId, completed: false },
      _avg: { 
        target: true, 
        current: true 
      }
    });

    res.json({
      stats: {
        totalGoals,
        completedGoals,
        activeGoals,
        overdueGoals,
        completionRate: Math.round(completionRate * 100) / 100,
        goalsByUnit,
        avgProgress: {
          target: avgProgress._avg.target || 0,
          current: avgProgress._avg.current || 0
        }
      }
    });

  } catch (error) {
    console.error('Errore recupero statistiche obiettivi:', error);
    res.status(500).json({
      error: 'Errore interno del server'
    });
  }
});

// GET /api/goals/:id - Recupera un obiettivo specifico
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const goal = await prisma.goal.findFirst({
      where: { id, userId }
    });

    if (!goal) {
      return res.status(404).json({
        error: 'Obiettivo non trovato'
      });
    }

    res.json({ goal });

  } catch (error) {
    console.error('Errore recupero obiettivo:', error);
    res.status(500).json({
      error: 'Errore interno del server'
    });
  }
});

// POST /api/goals - Crea un nuovo obiettivo
router.post('/', async (req: Request, res: Response) => {
  try {
    const goalData = goalSchema.parse(req.body);
    const userId = req.user!.id;

    // Converti la deadline se presente
    const deadline = goalData.deadline ? new Date(goalData.deadline) : undefined;

    const goal = await prisma.goal.create({
      data: {
        ...goalData,
        deadline,
        userId
      }
    });

    res.status(201).json({
      message: 'Obiettivo creato con successo',
      goal
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dati non validi',
        details: error.errors
      });
    }

    console.error('Errore creazione obiettivo:', error);
    res.status(500).json({
      error: 'Errore interno del server'
    });
  }
});

// PUT /api/goals/:id - Aggiorna un obiettivo
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const updateData = goalUpdateSchema.parse(req.body);

    // Verifica che l'obiettivo esista e appartenga all'utente
    const existingGoal = await prisma.goal.findFirst({
      where: { id, userId }
    });

    if (!existingGoal) {
      return res.status(404).json({
        error: 'Obiettivo non trovato'
      });
    }

    // Converti la deadline se presente
    const deadline = updateData.deadline ? new Date(updateData.deadline) : undefined;

    // Aggiorna l'obiettivo
    const updatedGoal = await prisma.goal.update({
      where: { id },
      data: {
        ...updateData,
        deadline,
        updatedAt: new Date()
      }
    });

    res.json({
      message: 'Obiettivo aggiornato con successo',
      goal: updatedGoal
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dati non validi',
        details: error.errors
      });
    }

    console.error('Errore aggiornamento obiettivo:', error);
    res.status(500).json({
      error: 'Errore interno del server'
    });
  }
});

// DELETE /api/goals/:id - Elimina un obiettivo
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Verifica che l'obiettivo esista e appartenga all'utente
    const goal = await prisma.goal.findFirst({
      where: { id, userId }
    });

    if (!goal) {
      return res.status(404).json({
        error: 'Obiettivo non trovato'
      });
    }

    await prisma.goal.delete({
      where: { id }
    });

    res.json({
      message: 'Obiettivo eliminato con successo'
    });

  } catch (error) {
    console.error('Errore eliminazione obiettivo:', error);
    res.status(500).json({
      error: 'Errore interno del server'
    });
  }
});

// PATCH /api/goals/:id/progress - Aggiorna il progresso di un obiettivo
router.patch('/:id/progress', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { current } = req.body;
    const userId = req.user!.id;

    if (typeof current !== 'number' || current < 0) {
      return res.status(400).json({
        error: 'Il progresso deve essere un numero positivo'
      });
    }

    // Verifica che l'obiettivo esista e appartenga all'utente
    const goal = await prisma.goal.findFirst({
      where: { id, userId }
    });

    if (!goal) {
      return res.status(404).json({
        error: 'Obiettivo non trovato'
      });
    }

    // Verifica che il progresso non superi l'obiettivo
    if (current > goal.target) {
      return res.status(400).json({
        error: 'Il progresso non può superare l\'obiettivo'
      });
    }

    // Determina se l'obiettivo è completato
    const completed = current >= goal.target;

    const updatedGoal = await prisma.goal.update({
      where: { id },
      data: {
        current,
        completed,
        updatedAt: new Date()
      }
    });

    res.json({
      message: 'Progresso aggiornato con successo',
      goal: updatedGoal
    });

  } catch (error) {
    console.error('Errore aggiornamento progresso:', error);
    res.status(500).json({
      error: 'Errore interno del server'
    });
  }
});

// PATCH /api/goals/:id/complete - Marca un obiettivo come completato
router.patch('/:id/complete', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Verifica che l'obiettivo esista e appartenga all'utente
    const goal = await prisma.goal.findFirst({
      where: { id, userId }
    });

    if (!goal) {
      return res.status(404).json({
        error: 'Obiettivo non trovato'
      });
    }

    if (goal.completed) {
      return res.status(400).json({
        error: 'L\'obiettivo è già completato'
      });
    }

    const updatedGoal = await prisma.goal.update({
      where: { id },
      data: {
        completed: true,
        current: goal.target, // Imposta il progresso al 100%
        updatedAt: new Date()
      }
    });

    res.json({
      message: 'Obiettivo completato con successo',
      goal: updatedGoal
    });

  } catch (error) {
    console.error('Errore completamento obiettivo:', error);
    res.status(500).json({
      error: 'Errore interno del server'
    });
  }
});

export default router;

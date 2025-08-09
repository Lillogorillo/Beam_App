import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Schema di validazione per le task
const taskSchema = z.object({
  title: z.string().min(1, 'Il titolo è obbligatorio'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('PENDING'),
  dueDate: z.string().datetime().optional(),
  estimatedTime: z.number().min(1).optional(),
  categoryId: z.string().optional()
});

// Schema per le subtask
const subtaskSchema = z.object({
  title: z.string().min(1, 'Il titolo della subtask è obbligatorio')
});

// Schema per aggiornamento task
const taskUpdateSchema = taskSchema.partial();

// Proteggi tutte le route
router.use(authenticateToken);

// GET /api/tasks - Lista tutte le task dell'utente
router.get('/', async (req: Request, res: Response) => {
  try {
    const { 
      status, 
      priority, 
      categoryId, 
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
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (priority && priority !== 'all') {
      where.priority = priority;
    }
    
    if (categoryId && categoryId !== 'all') {
      where.categoryId = categoryId;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    // Esegui query con paginazione
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true, color: true }
          },
          subtasks: {
            select: { id: true, title: true, completed: true }
          },
          _count: {
            select: { subtasks: true, timeSessions: true }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limitNum
      }),
      prisma.task.count({ where })
    ]);

    res.json({
      tasks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Errore recupero task:', error);
    res.status(500).json({
      error: 'Errore interno del server'
    });
  }
});

// GET /api/tasks/:id - Recupera una task specifica
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const task = await prisma.task.findFirst({
      where: { id, userId },
      include: {
        category: {
          select: { id: true, name: true, color: true }
        },
        subtasks: {
          orderBy: { createdAt: 'asc' }
        },
        timeSessions: {
          orderBy: { startTime: 'desc' },
          take: 10
        }
      }
    });

    if (!task) {
      return res.status(404).json({
        error: 'Task non trovata'
      });
    }

    res.json({ task });

  } catch (error) {
    console.error('Errore recupero task:', error);
    res.status(500).json({
      error: 'Errore interno del server'
    });
  }
});

// POST /api/tasks - Crea una nuova task
router.post('/', async (req: Request, res: Response) => {
  try {
    const taskData = taskSchema.parse(req.body);
    const userId = req.user!.id;

    // Verifica che la categoria appartenga all'utente se specificata
    if (taskData.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: taskData.categoryId, userId }
      });
      
      if (!category) {
        return res.status(400).json({
          error: 'Categoria non valida'
        });
      }
    }

    // Converti la data se presente
    const dueDate = taskData.dueDate ? new Date(taskData.dueDate) : undefined;

    const task = await prisma.task.create({
      data: {
        ...taskData,
        dueDate,
        userId
      },
      include: {
        category: {
          select: { id: true, name: true, color: true }
        },
        subtasks: true
      }
    });

    res.status(201).json({
      message: 'Task creata con successo',
      task
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dati non validi',
        details: error.errors
      });
    }

    console.error('Errore creazione task:', error);
    res.status(500).json({
      error: 'Errore interno del server'
    });
  }
});

// PUT /api/tasks/:id - Aggiorna una task
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const updateData = taskUpdateSchema.parse(req.body);

    // Verifica che la task esista e appartenga all'utente
    const existingTask = await prisma.task.findFirst({
      where: { id, userId }
    });

    if (!existingTask) {
      return res.status(404).json({
        error: 'Task non trovata'
      });
    }

    // Verifica che la categoria appartenga all'utente se specificata
    if (updateData.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: updateData.categoryId, userId }
      });
      
      if (!category) {
        return res.status(400).json({
          error: 'Categoria non valida'
        });
      }
    }

    // Converti la data se presente
    const dueDate = updateData.dueDate ? new Date(updateData.dueDate) : undefined;

    // Aggiorna la task
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        ...updateData,
        dueDate,
        updatedAt: new Date()
      },
      include: {
        category: {
          select: { id: true, name: true, color: true }
        },
        subtasks: true
      }
    });

    res.json({
      message: 'Task aggiornata con successo',
      task: updatedTask
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dati non validi',
        details: error.errors
      });
    }

    console.error('Errore aggiornamento task:', error);
    res.status(500).json({
      error: 'Errore interno del server'
    });
  }
});

// DELETE /api/tasks/:id - Elimina una task
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Verifica che la task esista e appartenga all'utente
    const task = await prisma.task.findFirst({
      where: { id, userId }
    });

    if (!task) {
      return res.status(404).json({
        error: 'Task non trovata'
      });
    }

    // Elimina la task (le subtask e time sessions verranno eliminate in cascata)
    await prisma.task.delete({
      where: { id }
    });

    res.json({
      message: 'Task eliminata con successo'
    });

  } catch (error) {
    console.error('Errore eliminazione task:', error);
    res.status(500).json({
      error: 'Errore interno del server'
    });
  }
});

// PATCH /api/tasks/:id/status - Aggiorna lo status di una task
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user!.id;

    if (!['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({
        error: 'Status non valido'
      });
    }

    const task = await prisma.task.findFirst({
      where: { id, userId }
    });

    if (!task) {
      return res.status(404).json({
        error: 'Task non trovata'
      });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status,
        completedAt: status === 'COMPLETED' ? new Date() : null,
        updatedAt: new Date()
      }
    });

    res.json({
      message: 'Status aggiornato con successo',
      task: updatedTask
    });

  } catch (error) {
    console.error('Errore aggiornamento status:', error);
    res.status(500).json({
      error: 'Errore interno del server'
    });
  }
});

// SUBTASK ROUTES

// POST /api/tasks/:id/subtasks - Aggiungi subtask
router.post('/:id/subtasks', async (req: Request, res: Response) => {
  try {
    const { id: taskId } = req.params;
    const userId = req.user!.id;
    const subtaskData = subtaskSchema.parse(req.body);

    // Verifica che la task esista e appartenga all'utente
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId }
    });

    if (!task) {
      return res.status(404).json({
        error: 'Task non trovata'
      });
    }

    const subtask = await prisma.subtask.create({
      data: {
        ...subtaskData,
        taskId
      }
    });

    res.status(201).json({
      message: 'Subtask aggiunta con successo',
      subtask
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dati non validi',
        details: error.errors
      });
    }

    console.error('Errore creazione subtask:', error);
    res.status(500).json({
      error: 'Errore interno del server'
    });
  }
});

// PUT /api/tasks/:taskId/subtasks/:subtaskId - Aggiorna subtask
router.put('/:taskId/subtasks/:subtaskId', async (req: Request, res: Response) => {
  try {
    const { taskId, subtaskId } = req.params;
    const userId = req.user!.id;
    const { title, completed } = req.body;

    // Verifica che la task esista e appartenga all'utente
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId }
    });

    if (!task) {
      return res.status(404).json({
        error: 'Task non trovata'
      });
    }

    const subtask = await prisma.subtask.update({
      where: { id: subtaskId },
      data: {
        ...(title && { title }),
        ...(completed !== undefined && { completed }),
        updatedAt: new Date()
      }
    });

    res.json({
      message: 'Subtask aggiornata con successo',
      subtask
    });

  } catch (error) {
    console.error('Errore aggiornamento subtask:', error);
    res.status(500).json({
      error: 'Errore interno del server'
    });
  }
});

// DELETE /api/tasks/:taskId/subtasks/:subtaskId - Elimina subtask
router.delete('/:taskId/subtasks/:subtaskId', async (req: Request, res: Response) => {
  try {
    const { taskId, subtaskId } = req.params;
    const userId = req.user!.id;

    // Verifica che la task esista e appartenga all'utente
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId }
    });

    if (!task) {
      return res.status(404).json({
        error: 'Task non trovata'
      });
    }

    await prisma.subtask.delete({
      where: { id: subtaskId }
    });

    res.json({
      message: 'Subtask eliminata con successo'
    });

  } catch (error) {
    console.error('Errore eliminazione subtask:', error);
    res.status(500).json({
      error: 'Errore interno del server'
    });
  }
});

export default router;

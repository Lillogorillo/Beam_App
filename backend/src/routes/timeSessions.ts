import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Schema di validazione per le sessioni temporali
const timeSessionSchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  duration: z.number().min(1).optional(),
  sessionType: z.enum(['WORK', 'SHORT_BREAK', 'LONG_BREAK']),
  taskId: z.string().optional()
});

// Schema per aggiornamento sessione
const timeSessionUpdateSchema = timeSessionSchema.partial();

// Proteggi tutte le route
router.use(authenticateToken);

// GET /api/time-sessions - Lista tutte le sessioni dell'utente
router.get('/', async (req: Request, res: Response) => {
  try {
    const { 
      sessionType, 
      taskId, 
      startDate, 
      endDate,
      page = '1',
      limit = '50'
    } = req.query;

    const userId = req.user!.id;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 50;
    const skip = (pageNum - 1) * limitNum;

    // Costruisci i filtri
    const where: any = { userId };
    
    if (sessionType && sessionType !== 'all') {
      where.sessionType = sessionType;
    }
    
    if (taskId && taskId !== 'all') {
      where.taskId = taskId;
    }
    
    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) {
        where.startTime.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.startTime.lte = new Date(endDate as string);
      }
    }

    // Esegui query con paginazione
    const [sessions, total] = await Promise.all([
      prisma.timeSession.findMany({
        where,
        include: {
          task: {
            select: { id: true, title: true, category: { select: { name: true, color: true } } }
          }
        },
        orderBy: { startTime: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.timeSession.count({ where })
    ]);

    res.json({
      sessions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Errore recupero sessioni:', error);
    res.status(500).json({
      error: 'Errore interno del server'
    });
  }
});

// GET /api/time-sessions/stats - Statistiche delle sessioni
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { period = 'week' } = req.query;
    const userId = req.user!.id;

    let startDate: Date;
    const now = new Date();

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToSubtract);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    }

    // Calcola statistiche
    const [totalSessions, totalWorkTime, totalBreakTime, avgSessionDuration] = await Promise.all([
      prisma.timeSession.count({
        where: { userId, startTime: { gte: startDate } }
      }),
      prisma.timeSession.aggregate({
        where: { 
          userId, 
          sessionType: 'WORK',
          startTime: { gte: startDate }
        },
        _sum: { duration: true }
      }),
      prisma.timeSession.aggregate({
        where: { 
          userId, 
          sessionType: { in: ['SHORT_BREAK', 'LONG_BREAK'] },
          startTime: { gte: startDate }
        },
        _sum: { duration: true }
      }),
      prisma.timeSession.aggregate({
        where: { 
          userId, 
          startTime: { gte: startDate },
          duration: { not: null }
        },
        _avg: { duration: true }
      })
    ]);

    // Statistiche per tipo di sessione
    const sessionsByType = await prisma.timeSession.groupBy({
      by: ['sessionType'],
      where: { userId, startTime: { gte: startDate } },
      _count: { id: true },
      _sum: { duration: true }
    });

    // Sessioni per giorno (ultimi 7 giorni)
    const dailyStats = await prisma.timeSession.groupBy({
      by: ['startTime'],
      where: { 
        userId, 
        startTime: { 
          gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) 
        }
      },
      _count: { id: true },
      _sum: { duration: true }
    });

    res.json({
      stats: {
        period,
        totalSessions,
        totalWorkTime: totalWorkTime._sum.duration || 0,
        totalBreakTime: totalBreakTime._sum.duration || 0,
        avgSessionDuration: Math.round((totalWorkTime._sum.duration || 0) / Math.max(totalSessions, 1)),
        sessionsByType,
        dailyStats: dailyStats.map(day => ({
          date: day.startTime.toISOString().split('T')[0],
          sessions: day._count.id,
          totalDuration: day._sum.duration || 0
        }))
      }
    });

  } catch (error) {
    console.error('Errore recupero statistiche sessioni:', error);
    res.status(500).json({
      error: 'Errore interno del server'
    });
  }
});

// GET /api/time-sessions/:id - Recupera una sessione specifica
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const session = await prisma.timeSession.findFirst({
      where: { id, userId },
      include: {
        task: {
          select: { 
            id: true, 
            title: true, 
            description: true,
            category: { select: { name: true, color: true } }
          }
        }
      }
    });

    if (!session) {
      return res.status(404).json({
        error: 'Sessione non trovata'
      });
    }

    res.json({ session });

  } catch (error) {
    console.error('Errore recupero sessione:', error);
    res.status(500).json({
      error: 'Errore interno del server'
    });
  }
});

// POST /api/time-sessions - Crea una nuova sessione
router.post('/', async (req: Request, res: Response) => {
  try {
    const sessionData = timeSessionSchema.parse(req.body);
    const userId = req.user!.id;

    // Verifica che la task appartenga all'utente se specificata
    if (sessionData.taskId) {
      const task = await prisma.task.findFirst({
        where: { id: sessionData.taskId, userId }
      });
      
      if (!task) {
        return res.status(400).json({
          error: 'Task non valida'
        });
      }
    }

    // Converti le date
    const startTime = new Date(sessionData.startTime);
    const endTime = sessionData.endTime ? new Date(sessionData.endTime) : undefined;

    // Calcola la durata se non specificata
    let duration = sessionData.duration;
    if (!duration && endTime) {
      duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
    }

    const session = await prisma.timeSession.create({
      data: {
        ...sessionData,
        startTime,
        endTime,
        duration,
        userId
      },
      include: {
        task: {
          select: { id: true, title: true }
        }
      }
    });

    res.status(201).json({
      message: 'Sessione creata con successo',
      session
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dati non validi',
        details: error.errors
      });
    }

    console.error('Errore creazione sessione:', error);
    res.status(500).json({
      error: 'Errore interno del server'
    });
  }
});

// PUT /api/time-sessions/:id - Aggiorna una sessione
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const updateData = timeSessionUpdateSchema.parse(req.body);

    // Verifica che la sessione esista e appartenga all'utente
    const existingSession = await prisma.timeSession.findFirst({
      where: { id, userId }
    });

    if (!existingSession) {
      return res.status(404).json({
        error: 'Sessione non trovata'
      });
    }

    // Verifica che la task appartenga all'utente se specificata
    if (updateData.taskId) {
      const task = await prisma.task.findFirst({
        where: { id: updateData.taskId, userId }
      });
      
      if (!task) {
        return res.status(400).json({
          error: 'Task non valida'
        });
      }
    }

    // Converti le date se presenti
    const startTime = updateData.startTime ? new Date(updateData.startTime) : undefined;
    const endTime = updateData.endTime ? new Date(updateData.endTime) : undefined;

    // Calcola la durata se non specificata
    let duration = updateData.duration;
    if (!duration && startTime && endTime) {
      duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
    }

    const updatedSession = await prisma.timeSession.update({
      where: { id },
      data: {
        ...updateData,
        startTime,
        endTime,
        duration,
        updatedAt: new Date()
      },
      include: {
        task: {
          select: { id: true, title: true }
        }
      }
    });

    res.json({
      message: 'Sessione aggiornata con successo',
      session: updatedSession
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dati non validi',
        details: error.errors
      });
    }

    console.error('Errore aggiornamento sessione:', error);
    res.status(500).json({
      error: 'Errore interno del server'
    });
  }
});

// DELETE /api/time-sessions/:id - Elimina una sessione
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Verifica che la sessione esista e appartenga all'utente
    const session = await prisma.timeSession.findFirst({
      where: { id, userId }
    });

    if (!session) {
      return res.status(404).json({
        error: 'Sessione non trovata'
      });
    }

    await prisma.timeSession.delete({
      where: { id }
    });

    res.json({
      message: 'Sessione eliminata con successo'
    });

  } catch (error) {
    console.error('Errore eliminazione sessione:', error);
    res.status(500).json({
      error: 'Errore interno del server'
    });
  }
});

// POST /api/time-sessions/:id/complete - Completa una sessione
router.post('/:id/complete', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Verifica che la sessione esista e appartenga all'utente
    const session = await prisma.timeSession.findFirst({
      where: { id, userId }
    });

    if (!session) {
      return res.status(404).json({
        error: 'Sessione non trovata'
      });
    }

    if (session.endTime) {
      return res.status(400).json({
        error: 'La sessione è già completata'
      });
    }

    const now = new Date();
    const duration = Math.round((now.getTime() - session.startTime.getTime()) / (1000 * 60));

    const updatedSession = await prisma.timeSession.update({
      where: { id },
      data: {
        endTime: now,
        duration,
        updatedAt: now
      }
    });

    res.json({
      message: 'Sessione completata con successo',
      session: updatedSession
    });

  } catch (error) {
    console.error('Errore completamento sessione:', error);
    res.status(500).json({
      error: 'Errore interno del server'
    });
  }
});

export default router;

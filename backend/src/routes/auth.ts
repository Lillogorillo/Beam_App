import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Schema di validazione per la registrazione
const registerSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(6, 'La password deve essere di almeno 6 caratteri'),
  name: z.string().min(2, 'Il nome deve essere di almeno 2 caratteri').optional()
});

// Schema di validazione per il login
const loginSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(1, 'Password richiesta')
});

// Genera JWT token
const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET non configurato');
  }
  
  return jwt.sign(
    { userId },
    secret,
    { expiresIn: '7d' }
  );
};

// Registrazione utente
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = registerSchema.parse(req.body);

    // Verifica se l'utente esiste già
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'Un utente con questa email esiste già'
      });
    }

    // Hash della password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crea l'utente
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email.split('@')[0]
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    });

    // Genera token
    const token = generateToken(user.id);

    // Crea categorie di default per l'utente
    const defaultCategories = [
      { name: 'Lavoro', color: '#3B82F6' },
      { name: 'Personale', color: '#10B981' },
      { name: 'Apprendimento', color: '#F59E0B' },
      { name: 'Salute', color: '#EF4444' }
    ];

    await Promise.all(
      defaultCategories.map(category =>
        prisma.category.create({
          data: {
            ...category,
            userId: user.id
          }
        })
      )
    );

    res.status(201).json({
      message: 'Utente registrato con successo',
      user,
      token,
      categories: defaultCategories
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dati non validi',
        details: error.errors
      });
    }

    console.error('Errore registrazione:', error);
    res.status(500).json({
      error: 'Errore interno del server'
    });
  }
});

// Login utente
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Trova l'utente
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true
      }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Credenziali non valide'
      });
    }

    // Verifica password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Credenziali non valide'
      });
    }

    // Genera token
    const token = generateToken(user.id);

    // Rimuovi password dalla risposta
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login effettuato con successo',
      user: userWithoutPassword,
      token
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dati non validi',
        details: error.errors
      });
    }

    console.error('Errore login:', error);
    res.status(500).json({
      error: 'Errore interno del server'
    });
  }
});

// Verifica token (proteggere route)
router.get('/verify', authenticateToken, (req: Request, res: Response) => {
  res.json({
    message: 'Token valido',
    user: req.user
  });
});

// Profilo utente
router.get('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        createdAt: true,
        _count: {
          select: {
            tasks: true,
            categories: true,
            timeSessions: true,
            goals: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'Utente non trovato'
      });
    }

    res.json({ user });

  } catch (error) {
    console.error('Errore profilo:', error);
    res.status(500).json({
      error: 'Errore interno del server'
    });
  }
});

// Aggiorna profilo
router.put('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { name, image } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(name && { name }),
        ...(image && { image })
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'Profilo aggiornato con successo',
      user: updatedUser
    });

  } catch (error) {
    console.error('Errore aggiornamento profilo:', error);
    res.status(500).json({
      error: 'Errore interno del server'
    });
  }
});

// Logout (invalida token lato client)
router.post('/logout', authenticateToken, (req: Request, res: Response) => {
  res.json({
    message: 'Logout effettuato con successo'
  });
});

export default router;

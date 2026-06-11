import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { AuthController } from '../controllers/authController';
import { ClientController } from '../controllers/clientController';
import { ConsultationController } from '../controllers/consultationController';
import { RecordingController, upload } from '../controllers/recordingController';
import { NoteController } from '../controllers/noteController';

const router = Router();

// --- Auth Routes ---
router.post('/auth/register', AuthController.register);
router.post('/auth/login', AuthController.login);

// --- Clients Routes (Protected) ---
router.get('/clients', authMiddleware, ClientController.getClients);
router.get('/clients/:id', authMiddleware, ClientController.getClientById);
router.post('/clients', authMiddleware, ClientController.createClient);
router.put('/clients/:id', authMiddleware, ClientController.updateClient);
router.delete('/clients/:id', authMiddleware, ClientController.deleteClient);

// --- Consultations Routes (Protected) ---
router.get('/consultations', authMiddleware, ConsultationController.getConsultations);
router.get('/consultations/:id', authMiddleware, ConsultationController.getConsultationById);
router.post('/consultations', authMiddleware, ConsultationController.createConsultation);
router.put('/consultations/:id', authMiddleware, ConsultationController.updateConsultation);
router.delete('/consultations/:id', authMiddleware, ConsultationController.deleteConsultation);

// --- Recordings Routes (Protected) ---
router.get('/recordings', authMiddleware, RecordingController.getRecordings);
router.get('/recordings/:id', authMiddleware, RecordingController.getRecordingById);
router.post('/recordings', authMiddleware, upload.single('audioFile'), RecordingController.uploadRecording);
router.delete('/recordings/:id', authMiddleware, RecordingController.deleteRecording);
router.post('/recordings/:id/ai-summary', authMiddleware, RecordingController.generateAISummary);

// --- Notes Routes (Protected) ---
router.get('/notes', authMiddleware, NoteController.getNotes);
router.get('/notes/:id', authMiddleware, NoteController.getNoteById);
router.post('/notes', authMiddleware, NoteController.createNote);
router.put('/notes/:id', authMiddleware, NoteController.updateNote);
router.delete('/notes/:id', authMiddleware, NoteController.deleteNote);

export default router;

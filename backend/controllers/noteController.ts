import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { NoteModel } from '../models/note';
import { ConsultationModel } from '../models/consultation';
import { ClientModel } from '../models/client';

export const NoteController = {
  async getNotes(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { search } = req.query;

      let notes = await NoteModel.findMany(userId);

      // Join metadata
      const consultations = await ConsultationModel.findMany(userId);
      const conMap = new Map(consultations.map(c => [c.id, c]));

      const clients = await ClientModel.findMany(userId);
      const clientMap = new Map(clients.map(c => [c.id, c]));

      let enriched = notes.map(n => {
        const con = conMap.get(n.consultationId);
        const client = con ? clientMap.get(con.clientId) : null;
        return {
          ...n,
          consultationTitle: con ? con.title : 'Deleted Consultation',
          clientName: client ? client.name : 'Unknown Client'
        };
      });

      if (search && typeof search === 'string') {
        const query = search.toLowerCase().trim();
        enriched = enriched.filter(n =>
          n.title.toLowerCase().includes(query) ||
          n.content.toLowerCase().includes(query) ||
          n.clientName.toLowerCase().includes(query) ||
          n.consultationTitle.toLowerCase().includes(query)
        );
      }

      // Sort by creation date descending
      enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.json(enriched);
    } catch (error) {
      console.error('[GetNotes Error]', error);
      res.status(500).json({ message: 'Error retrieving notes list.' });
    }
  },

  async getNoteById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const note = await NoteModel.findById(id, userId);
      if (!note) {
        res.status(404).json({ message: 'Note not found.' });
        return;
      }

      res.json(note);
    } catch (error) {
      console.error('[GetNoteById Error]', error);
      res.status(500).json({ message: 'Error fetching note detail.' });
    }
  },

  async createNote(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { consultationId, title, content } = req.body;

      if (!consultationId || !title || !content) {
        res.status(400).json({ message: 'Consultation Reference, Title, and Content are required.' });
        return;
      }

      // Verify ownership of the consultation
      const consultation = await ConsultationModel.findById(consultationId, userId);
      if (!consultation) {
        res.status(404).json({ message: 'Consultation not found or access denied.' });
        return;
      }

      const note = await NoteModel.create(userId, {
        consultationId,
        title,
        content
      });

      if (!note) {
        res.status(500).json({ message: 'Failed to create note database entry.' });
        return;
      }

      res.status(211).json(note);
    } catch (error) {
      console.error('[CreateNote Error]', error);
      res.status(500).json({ message: 'Failed to save note.' });
    }
  },

  async updateNote(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { title, content } = req.body;

      const note = await NoteModel.findById(id, userId);
      if (!note) {
        res.status(404).json({ message: 'Note not found or access denied.' });
        return;
      }

      const updated = await NoteModel.update(id, userId, {
        title,
        content
      });

      res.json(updated);
    } catch (error) {
      console.error('[UpdateNote Error]', error);
      res.status(500).json({ message: 'Failed to update note.' });
    }
  },

  async deleteNote(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const success = await NoteModel.delete(id, userId);
      if (!success) {
        res.status(404).json({ message: 'Note not found or access denied.' });
        return;
      }

      res.json({ message: 'Note deleted successfully.' });
    } catch (error) {
      console.error('[DeleteNote Error]', error);
      res.status(500).json({ message: 'Failed to delete note.' });
    }
  }
};

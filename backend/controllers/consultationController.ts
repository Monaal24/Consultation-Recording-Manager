import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ConsultationModel } from '../models/consultation';
import { ClientModel } from '../models/client';

export const ConsultationController = {
  async getConsultations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { search, status, type, startDate, endDate } = req.query;

      let consultations = await ConsultationModel.findMany(userId);

      // Join client names
      const clients = await ClientModel.findMany(userId);
      const clientMap = new Map(clients.map(c => [c.id, c.name]));

      let enriched = consultations.map(c => ({
        ...c,
        clientName: clientMap.get(c.clientId) || 'Unknown Client'
      }));

      // Search filters (title or client name)
      if (search && typeof search === 'string') {
        const query = search.toLowerCase().trim();
        enriched = enriched.filter(c => 
          c.title.toLowerCase().includes(query) || 
          c.clientName.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query)
        );
      }

      // Filter by Status
      if (status && typeof status === 'string' && status !== 'All') {
        enriched = enriched.filter(c => c.status === status);
      }

      // Filter by Type
      if (type && typeof type === 'string' && type !== 'All') {
        enriched = enriched.filter(c => c.consultationType === type);
      }

      // Filter by Date Range
      if (startDate && typeof startDate === 'string' && startDate) {
        enriched = enriched.filter(c => c.consultationDate >= startDate);
      }
      if (endDate && typeof endDate === 'string' && endDate) {
        enriched = enriched.filter(c => c.consultationDate <= endDate);
      }

      // Sort by date (descending by default for relevance)
      enriched.sort((a, b) => new Date(b.consultationDate).getTime() - new Date(a.consultationDate).getTime());

      res.json(enriched);
    } catch (error) {
      console.error('[GetConsultations Error]', error);
      res.status(500).json({ message: 'Error retrieving consultations list.' });
    }
  },

  async getConsultationById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const consultation = await ConsultationModel.findById(id, userId);
      if (!consultation) {
        res.status(404).json({ message: 'Consultation not found.' });
        return;
      }

      const client = await ClientModel.findById(consultation.clientId, userId);
      const enriched = {
        ...consultation,
        clientName: client ? client.name : 'Unknown Client',
        clientEmail: client ? client.email : ''
      };

      res.json(enriched);
    } catch (error) {
      console.error('[GetConsultationById Error]', error);
      res.status(500).json({ message: 'Error fetching consultation details.' });
    }
  },

  async createConsultation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { clientId, title, consultationDate, consultationType, status, description, notes } = req.body;

      if (!clientId || !title) {
        res.status(400).json({ message: 'Client reference and consultation title are required.' });
        return;
      }

      // Verify client exists and belongs to user
      const client = await ClientModel.findById(clientId, userId);
      if (!client) {
        res.status(400).json({ message: 'Invalid client reference provided.' });
        return;
      }

      const consultation = await ConsultationModel.create(userId, {
        clientId,
        title,
        consultationDate: consultationDate || new Date().toISOString(),
        consultationType: consultationType || 'Video',
        status: status || 'Scheduled',
        description: description || '',
        notes: notes || ''
      });

      res.status(211).json(consultation);
    } catch (error) {
      console.error('[CreateConsultation Error]', error);
      res.status(500).json({ message: 'Failed to schedule consultation.' });
    }
  },

  async updateConsultation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { title, consultationDate, consultationType, status, description, notes } = req.body;

      const existingCon = await ConsultationModel.findById(id, userId);
      if (!existingCon) {
        res.status(404).json({ message: 'Consultation not found or access denied.' });
        return;
      }

      const updated = await ConsultationModel.update(id, userId, {
        title,
        consultationDate,
        consultationType,
        status,
        description,
        notes
      });

      res.json(updated);
    } catch (error) {
      console.error('[UpdateConsultation Error]', error);
      res.status(500).json({ message: 'Error updating consultation details.' });
    }
  },

  async deleteConsultation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const success = await ConsultationModel.delete(id, userId);
      if (!success) {
        res.status(404).json({ message: 'Consultation not found or access denied.' });
        return;
      }

      res.json({ message: 'Consultation and any associated notes/recordings deleted successfully.' });
    } catch (error) {
      console.error('[DeleteConsultation Error]', error);
      res.status(500).json({ message: 'Failed to delete consultation.' });
    }
  }
};

import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ClientModel } from '../models/client';

export const ClientController = {
  async getClients(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { search } = req.query;

      let clients = await ClientModel.findMany(userId);

      if (search && typeof search === 'string') {
        const query = search.toLowerCase().trim();
        clients = clients.filter(c => 
          c.name.toLowerCase().includes(query) || 
          c.email.toLowerCase().includes(query) || 
          c.phone.toLowerCase().includes(query)
        );
      }

      res.json(clients);
    } catch (error) {
      console.error('[GetClients Error]', error);
      res.status(500).json({ message: 'Error retrieving clients list.' });
    }
  },

  async getClientById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const client = await ClientModel.findById(id, userId);
      if (!client) {
        res.status(404).json({ message: 'Client not found.' });
        return;
      }

      res.json(client);
    } catch (error) {
      console.error('[GetClientById Error]', error);
      res.status(500).json({ message: 'Error fetching client details.' });
    }
  },

  async createClient(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { name, email, phone, age, gender, address, notes } = req.body;

      if (!name) {
        res.status(400).json({ message: 'Client full name is required.' });
        return;
      }

      const client = await ClientModel.create(userId, {
        name,
        email: email || '',
        phone: phone || '',
        age: age ? Number(age) : 0,
        gender: gender || 'Unspecified',
        address: address || '',
        notes: notes || ''
      });

      res.status(211).json(client);
    } catch (error) {
      console.error('[CreateClient Error]', error);
      res.status(500).json({ message: 'Failed to register new client.' });
    }
  },

  async updateClient(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { name, email, phone, age, gender, address, notes } = req.body;

      const client = await ClientModel.findById(id, userId);
      if (!client) {
        res.status(404).json({ message: 'Client not found or access denied.' });
        return;
      }

      const updatedClient = await ClientModel.update(id, userId, {
        name,
        email,
        phone,
        age: age !== undefined ? Number(age) : undefined,
        gender,
        address,
        notes
      });

      res.json(updatedClient);
    } catch (error) {
      console.error('[UpdateClient Error]', error);
      res.status(500).json({ message: 'Error updating client profile.' });
    }
  },

  async deleteClient(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const success = await ClientModel.delete(id, userId);
      if (!success) {
        res.status(404).json({ message: 'Client not found or access denied.' });
        return;
      }

      res.json({ message: 'Client and all linked consultations/recordings deleted successfully.' });
    } catch (error) {
      console.error('[DeleteClient Error]', error);
      res.status(500).json({ message: 'Failed to delete client.' });
    }
  }
};

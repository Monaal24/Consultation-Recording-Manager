import { readDB, writeDB, generateId, IClient } from '../config/db';

export const ClientModel = {
  async findMany(userId: string): Promise<IClient[]> {
    const db = readDB();
    return db.clients.filter(c => c.createdBy === userId);
  },

  async findById(id: string, userId: string): Promise<IClient | null> {
    const db = readDB();
    return db.clients.find(c => c.id === id && c.createdBy === userId) || null;
  },

  async create(userId: string, clientData: Omit<IClient, 'id' | 'createdBy'>): Promise<IClient> {
    const db = readDB();
    const newClient: IClient = {
      id: generateId('c'),
      ...clientData,
      createdBy: userId
    };
    db.clients.push(newClient);
    writeDB(db);
    return newClient;
  },

  async update(id: string, userId: string, updateData: Partial<Omit<IClient, 'id' | 'createdBy'>>): Promise<IClient | null> {
    const db = readDB();
    const index = db.clients.findIndex(c => c.id === id && c.createdBy === userId);
    if (index === -1) return null;

    db.clients[index] = {
      ...db.clients[index],
      ...updateData
    };
    writeDB(db);
    return db.clients[index];
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const db = readDB();
    const originalLength = db.clients.length;
    
    // Also delete consultations, recordings, and notes belonging to this client to keep DB clean!
    // Get all consultations for this client
    const clientConsultations = db.consultations.filter(con => con.clientId === id && con.createdBy === userId);
    const conIds = clientConsultations.map(con => con.id);

    db.clients = db.clients.filter(c => !(c.id === id && c.createdBy === userId));
    
    if (db.clients.length === originalLength) {
      return false; // Not found
    }

    // Cascade delete consultations
    db.consultations = db.consultations.filter(con => !conIds.includes(con.id));
    // Cascade delete recordings linked to those consultations
    db.recordings = db.recordings.filter(rec => !conIds.includes(rec.consultationId));
    // Cascade delete notes linked to those consultations
    db.notes = db.notes.filter(n => !conIds.includes(n.consultationId));

    writeDB(db);
    return true;
  }
};

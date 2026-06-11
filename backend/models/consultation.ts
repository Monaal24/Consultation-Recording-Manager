import { readDB, writeDB, generateId, IConsultation } from '../config/db';

export const ConsultationModel = {
  async findMany(userId: string): Promise<IConsultation[]> {
    const db = readDB();
    return db.consultations.filter(c => c.createdBy === userId);
  },

  async findById(id: string, userId: string): Promise<IConsultation | null> {
    const db = readDB();
    return db.consultations.find(c => c.id === id && c.createdBy === userId) || null;
  },

  async create(userId: string, data: Omit<IConsultation, 'id' | 'createdBy'>): Promise<IConsultation> {
    const db = readDB();
    const newConsultation: IConsultation = {
      id: generateId('con'),
      ...data,
      createdBy: userId
    };
    db.consultations.push(newConsultation);
    writeDB(db);
    return newConsultation;
  },

  async update(id: string, userId: string, updateData: Partial<Omit<IConsultation, 'id' | 'createdBy'>>): Promise<IConsultation | null> {
    const db = readDB();
    const index = db.consultations.findIndex(c => c.id === id && c.createdBy === userId);
    if (index === -1) return null;

    db.consultations[index] = {
      ...db.consultations[index],
      ...updateData
    };
    writeDB(db);
    return db.consultations[index];
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const db = readDB();
    const originalLength = db.consultations.length;

    db.consultations = db.consultations.filter(c => !(c.id === id && c.createdBy === userId));
    
    if (db.consultations.length === originalLength) {
      return false; // Not found
    }

    // Cascade delete recordings linked to this consultation
    db.recordings = db.recordings.filter(rec => rec.consultationId !== id);
    // Cascade delete notes linked to this consultation
    db.notes = db.notes.filter(n => n.consultationId !== id);

    writeDB(db);
    return true;
  }
};
